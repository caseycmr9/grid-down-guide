// Base layers: California outline, neighbor states, 58 counties, lakes, rivers  ->  out/base.json
import fs from 'node:fs';
import AdmZip from 'adm-zip';
import * as shapefile from 'shapefile';
import { CA_BBOX, simplify, enc, ringArea, inBBox } from './geo.mjs';

fs.mkdirSync('out', { recursive: true });
fs.mkdirSync('raw/unz-county', { recursive: true });
fs.mkdirSync('raw/unz-state', { recursive: true });
new AdmZip('raw/census-county/county.zip').extractAllTo('raw/unz-county', true);
new AdmZip('raw/census-state/state.zip').extractAllTo('raw/unz-state', true);

function polys(geom) { // -> array of polygons, each an array of rings
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}
function ringsOut(multi, tol, minArea) {
  const out = [];
  for (const poly of multi) for (let r = 0; r < poly.length; r++) {
    const ring = poly[r];
    if (ringArea(ring) < minArea) continue;
    const s = simplify(ring, tol);
    if (s.length >= 4) out.push(enc(s));
  }
  return out;
}
function centroid(multi) { // centroid of the largest ring (for labels)
  let best = null, ba = -1;
  for (const poly of multi) { const a = ringArea(poly[0]); if (a > ba) { ba = a; best = poly[0]; } }
  let x = 0, y = 0; for (const p of best) { x += p[0]; y += p[1]; } return [+(x / best.length).toFixed(3), +(y / best.length).toFixed(3)];
}

const out = { bbox: CA_BBOX, state: [], neighbors: {}, counties: [], lakes: [], rivers: [] };

// states
{
  const src = await shapefile.open('raw/unz-state/cb_2023_us_state_500k.shp', 'raw/unz-state/cb_2023_us_state_500k.dbf');
  for (let r = await src.read(); !r.done; r = await src.read()) {
    const p = r.value.properties, nm = p.NAME;
    const multi = polys(r.value.geometry);
    if (nm === 'California') out.state = ringsOut(multi, 0.0012, 0.00002);
    else if (['Nevada', 'Oregon', 'Arizona'].includes(nm)) out.neighbors[nm] = ringsOut(multi, 0.01, 0.01);
  }
}
// counties
{
  const src = await shapefile.open('raw/unz-county/cb_2023_us_county_500k.shp', 'raw/unz-county/cb_2023_us_county_500k.dbf');
  for (let r = await src.read(); !r.done; r = await src.read()) {
    const p = r.value.properties; if (p.STATEFP !== '06') continue;
    const multi = polys(r.value.geometry);
    out.counties.push({ n: p.NAME, c: centroid(multi), r: ringsOut(multi, 0.0015, 0.00001) });
  }
  out.counties.sort((a, b) => a.n.localeCompare(b.n));
}
// lakes & rivers (Natural Earth), clipped by bbox test
{
  const lakes = JSON.parse(fs.readFileSync('raw/ne-lakes/lakes.geojson', 'utf8'));
  for (const f of lakes.features) {
    const multi = polys(f.geometry); if (!multi.length) continue;
    const c = multi[0][0][0]; if (!inBBox(c[0], c[1], [-125, 32, -113.5, 42.5])) continue;
    out.lakes.push({ n: f.properties.name || '', r: ringsOut(multi, 0.001, 0.00001) });
  }
  const rivers = JSON.parse(fs.readFileSync('raw/ne-rivers/rivers.geojson', 'utf8'));
  for (const f of rivers.features) {
    const g = f.geometry; if (!g) continue;
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    for (const ln of lines) {
      const clipped = ln.filter((p) => inBBox(p[0], p[1], [-124.8, 32.3, -113.9, 42.2]));
      if (clipped.length >= 2 && clipped.length === ln.length) out.rivers.push({ n: f.properties.name || '', l: enc(simplify(ln, 0.004)) });
      else if (clipped.length >= 2) out.rivers.push({ n: f.properties.name || '', l: enc(simplify(clipped, 0.004)) });
    }
  }
}
fs.writeFileSync('out/base.json', JSON.stringify(out));
const sz = fs.statSync('out/base.json').size;
console.log('base.json', sz, 'bytes;', out.counties.length, 'counties,', out.lakes.length, 'lakes,', out.rivers.length, 'river lines; state rings', out.state.length);

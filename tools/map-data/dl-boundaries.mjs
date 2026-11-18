import fs from 'node:fs';
const jobs = [
 ['https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip','raw/census-county/county.zip'],
 ['https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip','raw/census-state/state.zip'],
 ['https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson','raw/ne-lakes/lakes.geojson'],
 ['https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson','raw/ne-rivers/rivers.geojson']
];
for (const [u,f] of jobs) { const r = await fetch(u,{headers:{'User-Agent':'GridDownGuide-DataBuilder/1.0'}}); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); console.log(f, fs.statSync(f).size); }

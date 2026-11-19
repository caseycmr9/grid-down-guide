# Rebuilding the California map data

The files in `map/` (`ca-base.json`, `ca-places.json`, `ca-pois.json`, `ca-roads.json`) are generated. You only need this
folder when you want to refresh the map with newer OpenStreetMap data. Plan on about 20 minutes and 3 GB of disk.

Data sources (all free to use; keep the credit line in the app):
- OpenStreetMap contributors, via the Geofabrik California extract (ODbL license): roads, places, points of interest.
- US Census Bureau cartographic boundary files: state outline and counties (public domain).
- Natural Earth: lakes and rivers (public domain).

## Steps

Work in a scratch folder, not inside the project (the downloads are large).

1. Copy every file from this `tools/map-data/` folder into the scratch folder. Install the helpers there:
   `npm i shapefile adm-zip` and `python -m pip install osmium`.
2. `node dl-boundaries.mjs` (edit the folder names it writes to if needed: it expects `raw/census-county`, `raw/census-state`, `raw/ne-lakes`, `raw/ne-rivers`).
3. `node make-base.mjs` writes `out/base.json` (outline, counties, lakes, rivers).
4. `node dl-pbf.mjs` downloads the 1.3 GB California extract into `raw/geofabrik/`.
5. `python -P extract.py` (about 3 minutes) writes `raw/pbf/*.jsonl`; then `python -P parks.py` adds the national parks.
6. `node make-pois.mjs` writes `out/pois.json` and `out/places.json`.
7. `node --max-old-space-size=8192 make-graph.mjs --no-unref-primary --secondary-ref --stamp=YYYY-MM-DD` writes `out/roads.json`.
8. Turn each result into a file the app loads, written straight into the project's `map/` folder:
   `node wrap-json.mjs base out/base.json <project>/map/ca-base.json '{"updated":"YYYY-MM-DD","region":"California","sources":"..."}'`
   `node wrap-json.mjs places out/places.json <project>/map/ca-places.json` (same for `pois` and `roads`).
9. In the project: `node tools/validate-map.mjs --routes` (checks the format and drives 16 reference routes), then `node tools/build.mjs`.

## Choices made

- Roads: freeways, trunk roads, primary roads that carry a route number, and secondary roads that carry a route number. City streets are not included, so directions cover highways only.
- Points of interest were kept when OpenStreetMap has a name for them. Landmarks need a Wikidata link (a rough "this is notable" filter), peaks must be 9,800 ft or higher, small dams are dropped.
- OpenStreetMap is built by volunteers. Counts of vets, urgent care clinics and pharmacies are well below real life.

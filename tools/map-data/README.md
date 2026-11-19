# Rebuilding the California map data

The files in `map/` (`ca-base.json`, `ca-places.json`, `ca-pois.json`, `ca-roads.json`, `streets-index.json`) and the street packs in `streets/`
are generated. You only need this folder when you want to refresh the map with newer OpenStreetMap data. Plan on about 30 minutes and 5 GB of disk.

Data sources (all free to use; keep the credit line in the app):
- OpenStreetMap contributors, via the Geofabrik California extract (ODbL license): roads, streets, places, points of interest.
- US Census Bureau cartographic boundary files: state outline and counties (public domain).
- Natural Earth: lakes and rivers (public domain).
- USGS The National Map imagery (public domain) is used live by the satellite view and is not part of these files.

## Steps

Work in a scratch folder, not inside the project (the downloads are large).

1. Copy every file from this `tools/map-data/` folder into the scratch folder. Install the helpers there:
   `npm i shapefile adm-zip` and `python -m pip install osmium`.
2. `node dl-boundaries.mjs` (edit the folder names it writes to if needed: it expects `raw/census-county`, `raw/census-state`, `raw/ne-lakes`, `raw/ne-rivers`).
3. `node make-base.mjs` writes `out/base.json` (outline, counties, lakes, rivers).
4. `node dl-pbf.mjs` downloads the 1.3 GB California extract into `raw/geofabrik/`.
5. `python -P extract.py` (about 3 minutes) writes `raw/pbf/*.jsonl`; then `python -P parks.py` adds the national parks, and `python -P streets.py` (about 1 minute) extracts the smaller streets.
6. `node make-pois.mjs` writes `out/pois.json` and `out/places.json`.
7. `node --max-old-space-size=14000 make-graph.mjs --no-unref-primary --secondary-ref --stamp=YYYY-MM-DD` writes `out/roads.json` (the highway network),
   `out/roads-osmids.json` and `out/roads-meta.json` (a hash of the network). Run `streets.py` before this: highway junctions are added wherever a street meets a highway-network road, so the street packs can attach.
8. `node --max-old-space-size=20000 make-streets.mjs --out=<project>/streets --index=<project>/map/streets-index.json` writes one file per county (big counties in parts, at most about 90,000 edges each) and the index. The pack format is described at the top of `make-streets.mjs`.
9. Turn the other results into files the app loads, written straight into the project's `map/` folder:
   `node wrap-json.mjs base out/base.json <project>/map/ca-base.json '{"updated":"YYYY-MM-DD","region":"California","sources":"..."}'` (this also records the highway network's hash)
   `node wrap-json.mjs places out/places.json <project>/map/ca-places.json` (same for `pois` and `roads`).
10. In the project: `node tools/validate-map.mjs --routes` (format and 16 reference highway routes), `node tools/validate-streets.mjs --dir=streets --routes` (checks every pack against the highway network and drives street routes), then `node tools/build.mjs`.

Changing the highway network (step 7) changes its hash, so the street packs (step 8) and `ca-base.json` (step 9) must be rebuilt together. Phones that saved older packs show "Update needed" until the user downloads them again.

## Choices made

- Highway network (`ca-roads.json`, always in the app): freeways, trunk roads, primary roads that carry a route number, and secondary roads that carry a route number.
- Street packs (`streets/`, downloaded per county): primary and secondary roads without a route number, tertiary, unclassified, residential and living streets, with their links. Left out: service roads (driveways, parking aisles, alleys), dirt tracks, footpaths, and anything marked private or no motor vehicles. About 335,000 km in 65 files, 94.5 MB raw (33.5 MB compressed).
- Streets are kept at about 1 meter precision (the highway network is about 11 meters).
- Points of interest were kept when OpenStreetMap has a name for them. Landmarks need a Wikidata link (a rough "this is notable" filter), peaks must be 9,800 ft or higher, small dams are dropped.
- OpenStreetMap is built by volunteers. Counts of vets, urgent care clinics and pharmacies are well below real life, and some streets are missing.

# Extract the smaller roads (tertiary, unclassified, residential, living streets and their links) from the Geofabrik California extract.
# Writes raw/pbf/streets.jsonl, one way per line: {id, t: tags, n: [node ids], g: [[lon, lat], ...]}
# The bigger roads (motorway ... secondary) were already written to raw/pbf/hw.jsonl by extract.py.
# Usage: python -P streets.py
import json, os, sys, time
import osmium as o

PBF = 'raw/geofabrik/california-latest.osm.pbf'
OUT = 'raw/pbf/streets.jsonl'
KINDS = ('tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street')
TAGS = ('highway', 'ref', 'name', 'oneway', 'junction', 'access', 'motor_vehicle', 'vehicle', 'area', 'construction', 'proposed', 'abandoned', 'service')

os.makedirs('raw/pbf', exist_ok=True)
pairs = [('highway', k) for k in KINDS]
fp = o.FileProcessor(PBF, o.osm.osm_entity_bits.NODE | o.osm.osm_entity_bits.WAY).with_locations().with_filter(o.filter.TagFilter(*pairs))
t0 = time.time(); n = 0
with open(OUT, 'w', encoding='utf-8') as fh:
    for w in fp:
        if not w.is_way():
            continue
        try:
            geo = [(round(nd.location.lon, 6), round(nd.location.lat, 6)) for nd in w.nodes]
        except o.InvalidLocationError:
            continue
        t = {k: v for k, v in w.tags}
        fh.write(json.dumps({'id': w.id, 't': {k: t[k] for k in TAGS if k in t}, 'n': [nd.ref for nd in w.nodes], 'g': geo}, ensure_ascii=False, separators=(',', ':')) + '\n')
        n += 1
        if n % 200000 == 0:
            print(n, round(time.time() - t0), 's', flush=True)
print('done', n, 'ways', round(time.time() - t0), 's')

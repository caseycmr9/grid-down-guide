# National parks and big protected areas (relations) -> appended to raw/pbf/poi.jsonl as landmarks (subtype 4)
# The centre is the middle of the bounding box of the park's outline ways.
import json, sys
import osmium as o

PBF = 'raw/geofabrik/california-latest.osm.pbf'
def clean(s): return ' '.join(str(s).split()) if s else ''

rels = {}
for r in o.FileProcessor(PBF, o.osm.osm_entity_bits.RELATION).with_filter(o.filter.TagFilter(('boundary', 'national_park'), ('boundary', 'protected_area'))):
    t = {k: v for k, v in r.tags}
    nm = clean(t.get('name'))
    if not nm:
        continue
    is_np = t.get('boundary') == 'national_park'
    if not (is_np or (t.get('protect_class') in ('2', '3', '5') and t.get('wikidata'))):
        continue
    ways = [m.ref for m in r.members if m.type == 'w' and m.role in ('outer', '')]
    if ways:
        rels[r.id] = (nm, ways, is_np)
want = set()
for v in rels.values():
    want.update(v[1])
print('park relations', len(rels), 'member ways', len(want), flush=True)

wbox = {}
fp = o.FileProcessor(PBF, o.osm.osm_entity_bits.NODE | o.osm.osm_entity_bits.WAY).with_locations().with_filter(o.filter.IdFilter(list(want)))
for w in fp:
    if not w.is_way():
        continue
    xs, ys = [], []
    for nd in w.nodes:
        if nd.location.valid():
            xs.append(nd.location.lon); ys.append(nd.location.lat)
    if xs:
        wbox[w.id] = (min(xs), min(ys), max(xs), max(ys))
print('ways with boxes', len(wbox), flush=True)

n = 0
with open('raw/pbf/poi.jsonl', 'a', encoding='utf-8') as fh:
    for rid, (nm, ways, is_np) in rels.items():
        bs = [wbox[w] for w in ways if w in wbox]
        if not bs:
            continue
        x0 = min(b[0] for b in bs); y0 = min(b[1] for b in bs); x1 = max(b[2] for b in bs); y1 = max(b[3] for b in bs)
        fh.write(json.dumps({'k': 'landmark', 's': 4, 'x': round((x0 + x1) / 2, 6), 'y': round((y0 + y1) / 2, 6), 'n': nm, 'a': 'National park' if is_np else '', 'p': '', 'f': 0, 'c': ''}, ensure_ascii=False, separators=(',', ':')) + '\n')
        n += 1
print('parks written', n)

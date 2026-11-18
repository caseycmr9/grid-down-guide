# Extract roads, places, exits and points of interest from the Geofabrik California extract.
# Usage: python -P extract.py            (writes raw/pbf/*.jsonl)
import json, os, sys, time
import osmium as o

PBF = 'raw/geofabrik/california-latest.osm.pbf'
OUT = 'raw/pbf'
os.makedirs(OUT, exist_ok=True)

def clean(s):
    return ' '.join(str(s).split()) if s else ''

def first_phone(t):
    p = t.get('phone') or t.get('contact:phone') or ''
    return clean(p.split(';')[0])

def address(t):
    if t.get('addr:full'):
        return clean(t['addr:full'])
    street = clean(((t.get('addr:housenumber') or '') + ' ' + (t.get('addr:street') or '')))
    city = clean(t.get('addr:city'))
    return ', '.join(x for x in (street, city) if x)

def center_of(obj, is_way):
    if not is_way:
        loc = obj.location
        return (loc.lon, loc.lat) if loc.valid() else None
    xs = ys = n = 0
    seen = set()
    for nd in obj.nodes:
        if nd.ref in seen:
            continue
        seen.add(nd.ref)
        if nd.location.valid():
            xs += nd.location.lon
            ys += nd.location.lat
            n += 1
    return (xs / n, ys / n) if n else None

def ft(m):
    try:
        return int(round(float(str(m).split()[0].replace(',', '')) * 3.28084))
    except Exception:
        return None

import re
URGENT_RE = re.compile(r'urgent[ -]?care|immediate care|walk-in clinic|express care|prompt care', re.I)
VET_RE = re.compile(r'veterinar|animal (hospital|clinic|medical|emergency)|(pet|vet) (hospital|clinic|care)', re.I)

def classify(t):
    """Return a list of (category, subtype) for a tagged feature."""
    out = []
    name = t.get('name')
    wd = t.get('wikidata')
    am = t.get('amenity')
    sh = t.get('shop')
    nm = name or ''
    if am == 'hospital': out.append(('hospital', 0))
    if t.get('healthcare') == 'urgent_care' or (am == 'clinic' and t.get('urgent_care') == 'yes') or (nm and (am in ('clinic', 'doctors') or t.get('healthcare') in ('clinic', 'doctor', 'centre')) and URGENT_RE.search(nm)):
        out.append(('urgent', 0))
    if am == 'veterinary' or t.get('healthcare') == 'veterinary' or (nm and (am in ('clinic', 'doctors') or sh == 'pet' or t.get('healthcare')) and VET_RE.search(nm)):
        out.append(('vet', 0))
    if sh in ('supermarket', 'grocery'): out.append(('grocery', 0))
    if am == 'pharmacy' or t.get('healthcare') == 'pharmacy': out.append(('pharmacy', 0))
    if am == 'fuel': out.append(('fuel', 0))
    if am == 'fire_station': out.append(('fire', 0))
    if am == 'police': out.append(('police', 0))
    if t.get('aeroway') == 'aerodrome' and name and t.get('disused') != 'yes' and t.get('abandoned') != 'yes':
        out.append(('airport', 1 if t.get('iata') else 0))
    if sh in ('wholesale', 'doityourself', 'hardware', 'department_store', 'farm', 'agrarian') and name:
        out.append(('supplies', 0))
    # landmarks (a wikidata tag is used as the "notable" filter)
    if name:
        tour = t.get('tourism')
        if tour in ('attraction', 'viewpoint', 'museum', 'zoo', 'theme_park', 'aquarium') and wd:
            out.append(('landmark', 10 if tour in ('museum', 'zoo', 'theme_park', 'aquarium') else 0))
        if t.get('historic') and wd: out.append(('landmark', 1))
        if t.get('man_made') in ('lighthouse', 'tower', 'observatory') and wd: out.append(('landmark', 9))
        if t.get('waterway') == 'dam' and wd: out.append(('landmark', 8))
        if t.get('leisure') == 'stadium': out.append(('landmark', 5))
        if am in ('arena', 'theatre') and wd: out.append(('landmark', 5))
        if am in ('townhall', 'courthouse') and wd: out.append(('landmark', 6))
        if am in ('university', 'college') and wd: out.append(('landmark', 7))
        nat = t.get('natural')
        if nat in ('peak', 'volcano'):
            try: ele = float(str(t.get('ele', '0')).split()[0].replace(',', ''))
            except Exception: ele = 0
            if wd or ele >= 3000: out.append(('landmark', 2))
        if t.get('mountain_pass') == 'yes': out.append(('landmark', 3))
        if t.get('building') and wd:
            try: h = float(str(t.get('height', '0')).split()[0])
            except Exception: h = 0
            if h >= 80: out.append(('landmark', 9))
    return out

HW = {'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link'}
HWTAGS = ('highway', 'ref', 'name', 'oneway', 'junction', 'access', 'construction', 'proposed', 'bridge', 'tunnel', 'toll', 'lanes', 'maxspeed')

pairs = []
for v in HW: pairs.append(('highway', v))
pairs.append(('highway', 'motorway_junction'))
for v in ('hospital', 'veterinary', 'pharmacy', 'fuel', 'fire_station', 'police', 'clinic', 'arena', 'theatre', 'townhall', 'courthouse', 'university', 'college'): pairs.append(('amenity', v))
pairs.append(('healthcare', 'urgent_care'))
for v in ('clinic', 'doctor', 'centre', 'pharmacy', 'veterinary'): pairs.append(('healthcare', v))
pairs.append(('amenity', 'doctors'))
pairs.append(('shop', 'pet'))
for v in ('supermarket', 'grocery', 'wholesale', 'doityourself', 'hardware', 'department_store', 'farm', 'agrarian'): pairs.append(('shop', v))
pairs.append(('aeroway', 'aerodrome'))
for v in ('city', 'town', 'village', 'hamlet'): pairs.append(('place', v))
for v in ('peak', 'volcano'): pairs.append(('natural', v))
pairs.append(('mountain_pass', 'yes'))
pairs.append(('waterway', 'dam'))
pairs.append(('leisure', 'stadium'))
for v in ('lighthouse', 'tower', 'observatory'): pairs.append(('man_made', v))
for v in ('attraction', 'viewpoint', 'museum', 'zoo', 'theme_park', 'aquarium'): pairs.append(('tourism', v))

def run_pass(label, flt, handle):
    t0 = time.time(); n = 0
    fp = o.FileProcessor(PBF, o.osm.osm_entity_bits.NODE | o.osm.osm_entity_bits.WAY).with_locations().with_filter(flt)
    for obj in fp:
        n += 1
        try:
            handle(obj)
        except o.InvalidLocationError:
            pass
        except Exception as ex:
            print('skip', obj.id, type(ex).__name__, ex, file=sys.stderr)
        if n % 200000 == 0:
            print(label, n, round(time.time() - t0), 's', flush=True)
    print(label, 'done', n, round(time.time() - t0), 's', flush=True)

fh_hw = open(f'{OUT}/hw.jsonl', 'w', encoding='utf-8')
fh_poi = open(f'{OUT}/poi.jsonl', 'w', encoding='utf-8')
fh_pl = open(f'{OUT}/places.jsonl', 'w', encoding='utf-8')
fh_ex = open(f'{OUT}/exits.jsonl', 'w', encoding='utf-8')
counts = {}

PASS = {'n': 1}

def handle(obj):
    is_way = obj.is_way()
    t = {k: v for k, v in obj.tags}
    hw = t.get('highway')
    if PASS['n'] == 2:
        # second pass only adds historic sites and tall named buildings (landmarks); everything else was handled in pass 1
        cl = [c for c in classify(t) if c[0] == 'landmark' and (t.get('historic') or t.get('building'))]
        if not cl:
            return
        c = center_of(obj, is_way)
        if not c:
            return
        for cat, sub in set(cl):
            fh_poi.write(json.dumps({'k': 'landmark', 's': sub, 'x': round(c[0], 6), 'y': round(c[1], 6), 'n': clean(t.get('name')), 'a': address(t), 'p': first_phone(t), 'f': 0, 'c': clean(t.get('addr:city'))}, ensure_ascii=False, separators=(',', ':')) + '\n')
            counts['landmark'] = counts.get('landmark', 0) + 1
        return
    if is_way and hw in HW:
        geo = [(round(nd.location.lon, 6), round(nd.location.lat, 6)) for nd in obj.nodes]
        fh_hw.write(json.dumps({'id': obj.id, 't': {k: t[k] for k in HWTAGS if k in t}, 'n': [nd.ref for nd in obj.nodes], 'g': geo}, ensure_ascii=False, separators=(',', ':')) + '\n')
        counts['hw'] = counts.get('hw', 0) + 1
        return
    if not is_way and hw == 'motorway_junction':
        loc = obj.location
        if loc.valid():
            fh_ex.write(json.dumps({'id': obj.id, 'x': round(loc.lon, 6), 'y': round(loc.lat, 6), 'ref': t.get('ref', ''), 'name': t.get('name', ''), 'to': t.get('exit_to', '')}, ensure_ascii=False, separators=(',', ':')) + '\n')
            counts['exit'] = counts.get('exit', 0) + 1
        return
    pl = t.get('place')
    if not is_way and pl in ('city', 'town', 'village', 'hamlet') and t.get('name'):
        loc = obj.location
        if loc.valid():
            pop = 0
            try: pop = int(str(t.get('population', '0')).replace(',', '').split()[0])
            except Exception: pop = 0
            fh_pl.write(json.dumps({'x': round(loc.lon, 6), 'y': round(loc.lat, 6), 'n': clean(t['name']), 'k': pl, 'p': pop, 'w': 1 if t.get('wikidata') else 0}, ensure_ascii=False, separators=(',', ':')) + '\n')
            counts['place'] = counts.get('place', 0) + 1
        return
    cl = classify(t)
    if not cl:
        return
    c = center_of(obj, is_way)
    if not c:
        return
    seen = set()
    for cat, sub in cl:
        if (cat, sub) in seen: continue
        seen.add((cat, sub))
        name = clean(t.get('name') or t.get('brand') or t.get('operator'))
        flags = 0
        if t.get('opening_hours') == '24/7': flags |= 1
        if cat == 'hospital' and t.get('emergency') == 'yes': flags |= 2
        addr = address(t)
        if cat == 'landmark' and sub in (2, 3) and t.get('ele'):
            f = ft(t['ele'])
            if f: addr = 'Elevation %s ft' % format(f, ',')
        fh_poi.write(json.dumps({'k': cat, 's': sub, 'x': round(c[0], 6), 'y': round(c[1], 6), 'n': name, 'a': addr, 'p': first_phone(t), 'f': flags, 'c': clean(t.get('addr:city'))}, ensure_ascii=False, separators=(',', ':')) + '\n')
        counts[cat] = counts.get(cat, 0) + 1

run_pass('pass1', o.filter.TagFilter(*pairs), handle)
# pass 2: anything with a historic tag (any value) or a height tag (tall named buildings)
PASS['n'] = 2
run_pass('pass2', o.filter.KeyFilter('historic', 'height'), handle)
# national parks are added afterwards by parks.py (it needs a different kind of pass)
for f in (fh_hw, fh_poi, fh_pl, fh_ex): f.close()
json.dump(counts, open(f'{OUT}/counts.json', 'w'))
print(json.dumps(counts))

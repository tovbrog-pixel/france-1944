#!/usr/bin/env python3
"""Build slice roads, railways, rivers, canals and towns from public datasets. Runs on GitHub Actions.

Needs: osmium-tool, pyproj, shapely, openpyxl, pyshp.
Outputs in data/network/ (all coordinates in game km, see data/README.md):
  roads.json    OSM trunk/primary -> class 3, secondary -> 2, tertiary -> 1; motorways and links dropped
  rail.json     OSM rail, disused, abandoned and razed lines, narrow gauge; high-speed lines and sidings dropped
  canals.json   OSM waterway=canal
  rivers.json   HydroRIVERS reaches with mean discharge >= 1 m3/s, names joined from OSM waterway=river
  towns.json    French communes with 1936 census population >= 2,000 (INSEE), centroids from geo.api.gouv.fr
"""
import gzip, io, json, math, os, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.request, zipfile
from pyproj import Transformer
from shapely.geometry import LineString, MultiLineString, box, shape, Point
from shapely.ops import linemerge, transform
from shapely.strtree import STRtree

OUT = sys.argv[1] if len(sys.argv) > 1 else 'data/network'
TMP = os.environ.get('RUNNER_TEMP', '/tmp') + '/network'
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
E0, N1, WKM, HKM = 100_000, 7_110_000, 820, 450
CLIP = box(E0, N1 - HKM * 1000, E0 + WKM * 1000, N1)
TO_L93 = Transformer.from_crs(4326, 2154, always_xy=True).transform
TODAY = time.strftime('%Y-%m-%d')

def fetch(url, path):
    if os.path.exists(path): return path
    for k in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'france-1944 data build'})
            with urllib.request.urlopen(req, timeout=300) as r, open(path + '.part', 'wb') as f:
                while True:
                    b = r.read(1 << 22)
                    if not b: break
                    f.write(b)
            os.replace(path + '.part', path); return path
        except urllib.error.HTTPError as e:
            print('http', e.code, url)
            if e.code == 404: break
            time.sleep(10 * (k + 1))
        except Exception as e:
            print('retry', url, e); time.sleep(10 * (k + 1))
    raise RuntimeError('download failed ' + url)

def game(g):
    """Lambert-93 metres -> game km, rounded to 10 m."""
    def f(x, y, z=None): return (round(x / 1000 - 100, 2), round(7110 - y / 1000, 2))
    return transform(f, g)

def lines_of(g):
    if g.is_empty: return []
    if g.geom_type == 'LineString': return [g]
    if g.geom_type in ('MultiLineString', 'GeometryCollection'): return [h for x in g.geoms for h in lines_of(x)]
    return []

def year(v):
    m = re.search(r'(1[89]\d\d|20\d\d)', v or ''); return int(m.group(1)) if m else None

# ---------------- OSM
WANT = ['basse-normandie', 'haute-normandie', 'bretagne', 'pays-de-la-loire', 'centre', 'ile-de-france', 'picardie', 'nord-pas-de-calais',
        'champagne-ardenne', 'lorraine', 'bourgogne', 'franche-comte', 'normandie', 'hauts-de-france', 'grand-est', 'centre-val-de-loire',
        'bourgogne-franche-comte', 'belgium']
idx = json.loads(urllib.request.urlopen('https://download.geofabrik.de/index-v1-nogeom.json', timeout=120).read())
urls = {}
for ft in idx['features']:
    pr = ft['properties']
    if pr.get('parent') in ('france', 'europe') and pr['id'] in WANT and 'pbf' in pr.get('urls', {}): urls[pr['id']] = pr['urls']['pbf']
print('Geofabrik regions:', sorted(urls))
filtered = []
for r, u in sorted(urls.items()):
    pbf = None
    cands = ['https://download.openstreetmap.fr/extracts/europe/france/%s-latest.osm.pbf' % r.replace('-', '_'), u] if r != 'belgium' else \
            ['https://download.geofabrik.de/europe/belgium-latest.osm.pbf', 'https://download.openstreetmap.fr/extracts/europe/belgium-latest.osm.pbf', u]
    for cand in cands:
        try: pbf = fetch(cand, '%s/%s.osm.pbf' % (TMP, r)); break
        except RuntimeError as e: print(e)
    if not pbf: raise RuntimeError('no extract for ' + r)
    fo = pbf.replace('.osm.pbf', '.f.osm.pbf')
    subprocess.run(['osmium', 'tags-filter', '-O', '-o', fo, pbf,
                    'w/highway=trunk,primary,secondary,tertiary', 'w/railway=rail,disused,abandoned,razed,narrow_gauge,preserved',
                    'w/waterway=canal,river', 'n/place=city,town'], check=True)
    filtered.append(fo); os.remove(pbf); print('filtered', r)
merged = TMP + '/all.osm.pbf'
subprocess.run(['osmium', 'merge', '-O', '-o', merged] + filtered, check=True)
seq = TMP + '/all.geojsonseq'
subprocess.run(['osmium', 'export', '-O', '-f', 'geojsonseq', '-o', seq, merged], check=True)

roads = {1: [], 2: [], 3: []}; rails = {}; canals = []; rivnames = []; places = []
drop = {'yard', 'siding', 'spur', 'crossover'}
with open(seq) as f:
    for ln in f:
        ln = ln.strip('\x1e\n ')
        if not ln: continue
        ft = json.loads(ln); p = ft.get('properties', {}); g = ft.get('geometry')
        if not g: continue
        if g['type'] == 'Point':
            if p.get('place') in ('city', 'town') and p.get('name'):
                x, y = TO_L93(*g['coordinates'])
                if CLIP.contains(Point(x, y)): places.append((p['name'], x, y, p.get('population'), p.get('ref:INSEE')))
            continue
        if g['type'] not in ('LineString', 'MultiLineString'): continue
        geom = transform(TO_L93, shape(g))
        if not geom.intersects(CLIP): continue
        geom = geom.intersection(CLIP)
        hw, rw, ww = p.get('highway'), p.get('railway'), p.get('waterway')
        sy = year(p.get('start_date')) or year(p.get('opening_date'))
        if hw:
            if sy and sy >= 1945: continue
            c = 3 if hw in ('trunk', 'primary') else 2 if hw == 'secondary' else 1
            roads[c] += lines_of(geom)
        elif rw:
            if p.get('service') in drop or p.get('highspeed') == 'yes': continue
            if sy and sy >= 1945: continue
            ey = year(p.get('end_date')) or year(p.get('railway:end_date'))
            if ey and ey < 1944: continue
            k = (p.get('usage') or ('narrow' if rw == 'narrow_gauge' else 'other'), rw)
            rails.setdefault(k, []).extend(lines_of(geom))
        elif ww == 'canal':
            canals += [(p.get('name', ''), l) for l in lines_of(geom)]
        elif ww == 'river' and p.get('name'):
            rivnames += [(p['name'], l) for l in lines_of(geom)]

def merged_lines(ls, tol):
    if not ls: return []
    m = linemerge(MultiLineString(ls))
    return [l.simplify(tol) for l in lines_of(m) if l.length >= tol * 2]

def to_json(ls):
    return [[[x, y] for x, y in game(l).coords] for l in ls]

road_out = {'sources': [{'id': 'osm', 'title': 'OpenStreetMap via Geofabrik regional extracts', 'url': 'https://download.geofabrik.de/', 'read': TODAY, 'free': True,
                         'attribution': 'OpenStreetMap contributors, ODbL 1.0'}],
            'status': 'inference', 'note': 'Modern alignments of trunk, primary, secondary and tertiary roads used as a proxy for the 1944 routes nationales and departmental roads; motorways, links and roads with a start date after 1944 removed; to be checked against GSGS 4250 and GSGS 2738 sheets. Simplified to 100 m.',
            'classes': {}}
for c in (3, 2, 1):
    ls = merged_lines(roads[c], 100.0); road_out['classes'][str(c)] = to_json(ls)
    print('roads class', c, len(ls), 'lines', round(sum(l.length for l in ls) / 1000), 'km')
json.dump(road_out, open(OUT + '/roads.json', 'w'), separators=(',', ':'))

rail_out = {'sources': road_out['sources'], 'status': 'inference',
            'note': 'OSM lines tagged railway=rail, disused, abandoned, razed, preserved or narrow_gauge; high-speed lines, sidings, yards and lines with a start date after 1944 or an end date before 1944 removed. Abandoned lines are only as complete as OSM mapping; to be checked against the 1944 GSGS sheets. Simplified to 100 m.',
            'lines': []}
for (usage, rw), ls in sorted(rails.items()):
    ml = merged_lines(ls, 100.0)
    for l in to_json(ml): rail_out['lines'].append({'usage': usage, 'osm': rw, 'pts': l})
    print('rail', usage, rw, len(ml), 'lines', round(sum(l.length for l in ml) / 1000), 'km')
json.dump(rail_out, open(OUT + '/rail.json', 'w'), separators=(',', ':'))

cn = {}
for n, l in canals: cn.setdefault(n, []).append(l)
json.dump({'sources': road_out['sources'], 'status': 'inference', 'note': 'Modern OSM canals; post-1944 canals to be removed by hand',
           'canals': [{'name': n, 'pts': l} for n, ls in cn.items() for l in to_json(merged_lines(ls, 100.0))]}, open(OUT + '/canals.json', 'w'), separators=(',', ':'))

# ---------------- HydroRIVERS
hz = fetch('https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_eu_shp.zip', TMP + '/hr.zip')
with zipfile.ZipFile(hz) as z: z.extractall(TMP + '/hr')
import shapefile
shp = [os.path.join(dp, f) for dp, _, fs in os.walk(TMP + '/hr') for f in fs if f.endswith('.shp')][0]
sf = shapefile.Reader(shp)
flds = [f[0] for f in sf.fields[1:]]
name_tree = STRtree([l for _, l in rivnames]) if rivnames else None
rivers = []
lon0, lat0, lon1, lat1 = -6, 46.5, 7, 51.5
for sr in sf.iterShapeRecords():
    a = dict(zip(flds, sr.record)); q = a.get('DIS_AV_CMS', 0)
    if q < 1: continue
    bb = sr.shape.bbox
    if bb[2] < lon0 or bb[0] > lon1 or bb[3] < lat0 or bb[1] > lat1: continue
    g = transform(TO_L93, LineString(sr.shape.points))
    if not g.intersects(CLIP): continue
    for l in lines_of(g.intersection(CLIP)):
        nm = ''
        if name_tree is not None:
            mid = l.interpolate(0.5, normalized=True)
            i = name_tree.nearest(mid)
            if rivnames[i][1].distance(mid) < 800: nm = rivnames[i][0]
        rivers.append({'name': nm, 'q': round(q, 1), 'order': a.get('ORD_STRA'), 'up_km2': round(a.get('UPLAND_SKM', 0)), 'pts': to_json([l])[0]})
json.dump({'sources': [{'id': 'hydrorivers', 'title': 'HydroRIVERS v1.0, Europe', 'url': 'https://www.hydrosheds.org/products/hydrorivers', 'read': TODAY, 'free': True,
                        'attribution': 'Lehner, B., Grill G. (2013), Hydrological Processes 27(15)'}, road_out['sources'][0]],
           'status': 'inference', 'note': 'q is modelled long-term mean discharge in m3/s; names joined from the nearest OSM river within 800 m. Which rivers stop vehicles is set in the scenario from q, to be checked against the official histories.',
           'rivers': rivers}, open(OUT + '/rivers.json', 'w'), separators=(',', ':'))
print('rivers', len(rivers))

# ---------------- towns: INSEE 1936 census, geo.api.gouv.fr centroids
page = urllib.request.urlopen('https://www.insee.fr/fr/statistiques/3698339', timeout=120).read().decode('utf-8', 'replace')
m = re.search(r'href="([^"]*base-pop-historiques[^"]*\.xlsx)"', page)
xurl = urllib.parse.urljoin('https://www.insee.fr/', m.group(1)) if m else 'https://www.insee.fr/fr/statistiques/fichier/3698339/base-pop-historiques-1876-2023.xlsx'
import openpyxl
xp = fetch(xurl, TMP + '/pop.xlsx')
wb = openpyxl.load_workbook(xp, read_only=True); ws = wb[wb.sheetnames[0]]
hdr = None; pop36 = {}; names = {}
for row in ws.iter_rows(values_only=True):
    cells = [str(c).strip() if c is not None else '' for c in row]
    if hdr is None:
        if 'CODGEO' in cells: hdr = cells
        continue
    d = dict(zip(hdr, row)); code = str(d.get('CODGEO') or '')
    col = next((h for h in hdr if h.endswith('1936')), None)
    v = d.get(col) if col else None
    if not code or v in (None, ''): continue
    if code.startswith('751') and len(code) == 5: code, nm = '75056', 'Paris'
    else: nm = d.get('LIBGEO') or ''
    pop36[code] = pop36.get(code, 0) + float(v); names[code] = nm
cen = json.loads(urllib.request.urlopen('https://geo.api.gouv.fr/communes?fields=code,nom,centre&format=json&geometry=centre', timeout=300).read())
towns = []
for c in cen:
    p = pop36.get(c['code'])
    if not p or p < 2000 or not c.get('centre'): continue
    x, y = TO_L93(*c['centre']['coordinates'])
    if not CLIP.contains(Point(x, y)): continue
    gx, gy = round(x / 1000 - 100, 2), round(7110 - y / 1000, 2)
    towns.append({'name': names.get(c['code']) or c['nom'], 'insee': c['code'], 'pop1936': int(p), 'size': 3 if p >= 50000 else 2 if p >= 10000 else 1, 'x': gx, 'y': gy})
be = [{'name': n, 'pop': pp, 'x': round(x / 1000 - 100, 2), 'y': round(7110 - y / 1000, 2)} for n, x, y, pp, ref in places if not ref and y > 6990000]
json.dump({'sources': [{'id': 'insee-pop', 'title': 'INSEE, Historique des populations communales 1876-2023', 'url': xurl, 'read': TODAY, 'free': True},
                       {'id': 'geo-api', 'title': 'geo.api.gouv.fr commune centroids', 'url': 'https://geo.api.gouv.fr/', 'read': TODAY, 'free': True}, road_out['sources'][0]],
           'status': 'sourced', 'note': '1936 census population in present-day commune boundaries; size 3 >= 50,000, 2 >= 10,000, 1 >= 2,000. Centroids are modern town-hall points. Belgian and other non-French places come from OSM place nodes with modern population and carry status inference.',
           'towns': sorted(towns, key=lambda t: -t['pop1936']), 'otherPlaces': be}, open(OUT + '/towns.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print('towns', len(towns), 'other places', len(be))

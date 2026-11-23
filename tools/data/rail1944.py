#!/usr/bin/env python3
"""Build the 1944 railway network for the slice.

Source of dates: 'Un siecle de gares du reseau ferroviaire francais : en service, fermees ou disparues' (R. Jeansoulin,
data.gouv.fr, ODbL, version Feb 2022): about 17,750 stations and junctions, each tied to a line number and kilometre
point; the first record of each line carries its end of service ('end'): 'no' (still open), closure years, or partial
closures and declassifications with the share of the line affected.

Method:
  1. Each line number becomes a polyline through its stations in kilometre order, with a 1944 status from 'end'.
  2. Every OSM rail piece already built (data/network/rail.json) is matched to the dataset line that runs beside most
     of its length (within 1.2 km).
  3. Lines in use today (OSM railway=rail) are kept. Disused, abandoned and razed pieces are kept when their matched
     line was open in 1944, dropped when it had closed before 1944, and dropped when no dataset line matches (mostly
     local narrow-gauge lines, which the dataset does not cover).
Writes data/network/rail-1944.json and data/network/rail-1944-report.json.
"""
import json, re
from collections import Counter, defaultdict
from pyproj import Transformer
TR = Transformer.from_crs(4326, 2154, always_xy=True)
def game(lon, lat):
    x, y = TR.transform(lon, lat); return (x / 1000 - 100, 7110 - y / 1000)
G = json.load(open('sources/datagouv/un-siecle-de-gares-du-reseau-ferroviaire-francais-en-service/gares1925anosjours_versionFev2022.geojson'))['features']

def status(end):
    e = str(end or '').strip()
    if e == '' : return None, 'no end field'
    if e.lower() == 'no': return 'open', 'still open'
    ys = [int(y) for y in re.findall(r'\b(18\d\d|19\d\d|20\d\d)\b', e)]
    if not ys: return None, 'end "%s" has no year' % e
    # share of the line closed or declassified before 1944
    parts = re.findall(r'(?:(DEC|ferm\w*))?:?(\d+)%:([\d\-]+)', e)
    if parts:
        before = 0
        for kind, pct, yrs in parts:
            yy = [int(y) for y in re.findall(r'\d{4}', yrs)]
            if yy and min(yy) < 1944: before += int(pct)
        if before >= 90: return 'closed', 'closed or declassified before 1944 (%d%%): %s' % (before, e)
        if before > 0: return 'partial', 'part closed before 1944 (%d%%): %s' % (before, e)
        return 'open', 'all closures after 1943: %s' % e
    if max(ys) < 1944: return 'closed', 'closed %d' % max(ys)
    if min(ys) >= 1944: return 'open', 'closed %d, after 1944' % min(ys)
    return 'partial', 'closures span 1944: %s' % e

lines = defaultdict(list); meta = {}
for f in G:
    p = f['properties']; n = p.get('num')
    if not n or not f.get('geometry'): continue
    lon, lat = f['geometry']['coordinates'][:2]
    lines[n].append((float(p.get('pk') or 0), game(lon, lat), p.get('id', '')))
    if 'end' in p and n not in meta: meta[n] = (p['end'], p.get('info', ''))
L = {}
for n, st in lines.items():
    st.sort(key=lambda s: s[0]); pts = [s[1] for s in st]
    end, info = meta.get(n, (None, ''))
    s, why = status(end)
    if 'LGV' in info: s, why = 'post1944', 'high-speed line'
    L[n] = {'pts': pts, 'status': s, 'why': why, 'name': re.sub(r'^origine\s+', '', info).split(' +')[0].replace('_', ' ')}

# grid index of dataset line segments
CELL = 1.2
grid = defaultdict(set)
def segcells(a, b):
    n = max(1, int(((b[0]-a[0])**2 + (b[1]-a[1])**2) ** .5 / (CELL / 2)))
    for k in range(n + 1):
        x = a[0] + (b[0]-a[0]) * k / n; y = a[1] + (b[1]-a[1]) * k / n
        yield (int(x // CELL), int(y // CELL))
for n, l in L.items():
    for a, b in zip(l['pts'], l['pts'][1:]):
        if ((b[0]-a[0])**2 + (b[1]-a[1])**2) ** .5 > 40: continue   # gaps between distant stations are not track
        for c in segcells(a, b): grid[c].add(n)
def dseg(p, a, b):
    dx, dy = b[0]-a[0], b[1]-a[1]; l2 = dx*dx + dy*dy
    t = 0 if l2 == 0 else max(0, min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / l2))
    return ((p[0]-a[0]-t*dx)**2 + (p[1]-a[1]-t*dy)**2) ** .5
def near(p):
    c = (int(p[0] // CELL), int(p[1] // CELL)); best, bd = None, 1.2
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            for n in grid.get((c[0]+i, c[1]+j), ()):
                pts = L[n]['pts']
                for a, b in zip(pts, pts[1:]):
                    d = dseg(p, a, b)
                    if d < bd: bd, best = d, n
    return best
def dens(seg, step=.5):
    o = [seg[0]]
    for a, b in zip(seg, seg[1:]):
        k = max(1, int(((b[0]-a[0])**2 + (b[1]-a[1])**2) ** .5 / step))
        o += [(a[0] + (b[0]-a[0]) * q / k, a[1] + (b[1]-a[1]) * q / k) for q in range(1, k + 1)]
    return o

R = json.load(open('data/network/rail.json'))
kept, report = [], Counter(); kmrep = Counter(); dropped = []
for l in R['lines']:
    pts = l['pts']; km = sum(((b[0]-a[0])**2 + (b[1]-a[1])**2) ** .5 for a, b in zip(pts, pts[1:]))
    if l['osm'] == 'rail' and l['usage'] not in ('tourism', 'test'):
        kept.append(dict(l, y1944='open', basis='in use today')); report['rail today'] += 1; kmrep['rail today'] += km; continue
    votes = Counter(near(p) for p in dens(pts)); votes.pop(None, None)
    if not votes:
        report['unmatched, dropped'] += 1; kmrep['unmatched, dropped'] += km; dropped.append({'osm': l['osm'], 'usage': l['usage'], 'km': round(km, 1), 'why': 'no dataset line within 1.2 km'}); continue
    n = votes.most_common(1)[0][0]; st = L[n]['status']
    if st == 'open' and L[n]['why'] == 'still open':   # a closed piece beside a line still in use: an old alignment or a spur next to track already kept
        report['dropped (beside a line in use)'] += 1; kmrep['dropped (beside a line in use)'] += km; continue
    if st in ('open', 'partial') or (st is None and l['osm'] == 'rail'):
        kept.append(dict(l, y1944=st or 'unknown', line=n, lineName=L[n]['name'], basis=L[n]['why'])); report['historic kept (%s)' % st] += 1; kmrep['historic kept (%s)' % st] += km
    else:
        report['dropped (%s)' % (st or 'no date')] += 1; kmrep['dropped (%s)' % (st or 'no date')] += km
        dropped.append({'osm': l['osm'], 'usage': l['usage'], 'km': round(km, 1), 'line': n, 'lineName': L[n]['name'], 'why': L[n]['why']})
src = {'id': 'jeansoulin-gares', 'title': "R. Jeansoulin, Un siecle de gares du reseau ferroviaire francais : en service, fermees ou disparues (data.gouv.fr, version Feb 2022)",
       'url': 'https://www.data.gouv.fr/datasets/un-siecle-de-gares-du-reseau-ferroviaire-francais-en-service-fermees-ou-disparues', 'read': '2026-11-22', 'free': True, 'licence': 'ODbL'}
out = dict(R, lines=kept, sources=R['sources'] + [src], status='inference',
           note='OSM geometry; 1944 status of disused, abandoned and razed pieces from the dataset line they follow (rail-1944-report.json). Lines in use today are kept as open in 1944; high-speed lines were already removed. Unmatched closed pieces, mostly local narrow-gauge lines the dataset does not cover, are left out.')
json.dump(out, open('data/network/rail-1944.json', 'w'), separators=(',', ':'))
json.dump({'sources': [src], 'summary': {k: {'pieces': report[k], 'km': round(kmrep[k])} for k in report},
           'lineStatus': Counter(l['status'] or 'unknown' for l in L.values()), 'dropped': dropped}, open('data/network/rail-1944-report.json', 'w'), indent=0, ensure_ascii=False)
print('dataset lines', len(L), dict(Counter(l['status'] or 'unknown' for l in L.values())))
for k in report: print('%-28s %5d pieces %7.0f km' % (k, report[k], kmrep[k]))

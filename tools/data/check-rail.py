#!/usr/bin/env python3
"""Check the OSM-derived railway lines against the opening and closing dates in the French Wikipedia line articles
(sources/raw/frline-*.txt, fetched by the sources workflow). Writes data/network/rail-check.json and a filtered
data/network/rail-1944.json that drops named lines the articles show as closed to all traffic or lifted before 1944,
or opened after 1944."""
import glob, json, re, os
J = json.load(open('data/network/rail-names.json'))
MAN = json.load(open('sources/manifest.json'))
arts = {}
for k, v in MAN.items():
    if k.startswith('raw/frline-') and os.path.exists('sources/' + k):
        arts[v['note']] = open('sources/' + k).read()

def norm(n):
    n = re.sub(r'(?i)^ancienne\s+', '', n.strip()); n = n[0].upper() + n[1:] if n else n
    return re.sub(r'\s+', ' ', n.replace('’', "'"))

def infobox(t):
    m = re.search(r'\{\{\s*Infobox Ligne ferroviaire(.*?)\n\}\}', t, re.S | re.I)
    if not m: return None
    f = {}
    for k, v in re.findall(r'\n\s*\|\s*([^=\n]+?)\s*=\s*([^\n]*)', m.group(1)): f[k.strip().lower()] = v.strip()
    return f

def years(s): return [int(y) for y in re.findall(r'\b(18[3-9]\d|19\d\d|20[0-2]\d)\b', s or '')]

def verdict(t):
    if re.match(r'\s*#REDIRECT', t, re.I):
        return None
    f = infobox(t)
    if f is None: return {'state': 'no-infobox'}
    op = [y for k, v in f.items() if 'ouverture' in k and 'fermeture' not in k for y in years(v)]
    full, pax, frt, lift = [], [], [], []
    for k, v in f.items():
        ys = years(v)
        if not ys: continue
        if 'déclass' in k or 'declass' in k or 'dépos' in k or 'depos' in k or 'suppression' in k: lift += ys
        elif 'fermeture' in k:
            if 'voyageur' in k: pax += ys
            elif 'marchandise' in k or 'fret' in k: frt += ys
            else: full += ys
    o = {'opened': min(op) if op else None, 'closedAll': max(full) if full else None, 'closedPax': max(pax) if pax else None, 'closedFreight': max(frt) if frt else None, 'lifted': max(lift) if lift else None}
    # the line existed in 1944 unless it opened later, or every closing date that covers all traffic falls before 1944
    gone = None
    if o['opened'] and o['opened'] > 1944: gone = 'opened %d' % o['opened']
    allc = [y for y in (o['closedAll'], o['lifted']) if y]
    if o['closedFreight'] and o['closedPax']: allc.append(max(o['closedFreight'], o['closedPax']))
    if allc and max(allc) < 1944: gone = 'closed %d' % max(allc)
    o['state'] = 'gone' if gone else ('ok' if (o['opened'] or allc or pax or frt) else 'no-dates')
    o['why'] = gone or ''
    return o

res = []
for l in J['lines']:
    t = norm(l['name']); a = arts.get(t)
    r = {'name': l['name'], 'osm': l['osm'], 'km': l['km']}
    if a is None: r['state'] = 'no-article'
    else:
        v = verdict(a)
        r.update(v if v else {'state': 'redirect'})
    res.append(r)
from collections import Counter
cnt = Counter(r['state'] for r in res); km = Counter()
for r in res: km[r['state']] += r['km']
gone = {r['name'] for r in res if r['state'] == 'gone'}
json.dump({'note': 'Named OSM rail lines checked against the infobox dates of the French Wikipedia article with the same title. gone = opened after 1944, or closed to all traffic or lifted before 1944.',
           'sources': [{'id': 'frwiki-lines', 'title': 'French Wikipedia railway line articles (sources/raw/frline-*.txt)', 'read': '2026-11-22', 'free': True}],
           'summary': {k: {'lines': cnt[k], 'km': round(km[k])} for k in cnt}, 'lines': res}, open('data/network/rail-check.json', 'w'), indent=0, ensure_ascii=False)
# filtered rail: drop the geometry of lines found gone (matched by name)
R = json.load(open('data/network/rail.json'))
drop = [l for l in J['lines'] if l['name'] in gone]
def dens(seg, step=.2):
    o = [seg[0]]
    for a, b in zip(seg, seg[1:]):
        n = max(1, int(((b[0]-a[0])**2 + (b[1]-a[1])**2) ** .5 / step))
        o += [[a[0] + (b[0]-a[0]) * k / n, a[1] + (b[1]-a[1]) * k / n] for k in range(1, n + 1)]
    return o
G = .3
def cell(p): return (int(p[0] // G), int(p[1] // G))
dk = set()
for l in drop:
    for seg in l['pts']:
        for p in dens(seg):
            c = cell(p); dk.update((c[0] + i, c[1] + j) for i in (-1, 0, 1) for j in (-1, 0, 1))
kept, removed = [], 0
for l in R['lines']:
    pts = dens(l['pts']) if len(l['pts']) > 1 else l['pts']; hit = sum(1 for p in pts if cell(p) in dk)
    if l['osm'] != 'rail' and pts and hit / len(pts) > .5: removed += 1; continue
    kept.append(l)
R2 = dict(R); R2['lines'] = kept
R2['note'] = R['note'] + ' Lines that the French Wikipedia articles show as opened after 1944 or closed to all traffic before 1944 are removed (rail-check.json).'
json.dump(R2, open('data/network/rail-1944.json', 'w'), separators=(',', ':'))
print(dict(cnt)); print({k: round(v) for k, v in km.items()}); print('removed pieces', removed, 'of', len(R['lines']))
for r in res:
    if r['state'] == 'gone': print('  gone:', r['name'], r['why'], r['km'], 'km')

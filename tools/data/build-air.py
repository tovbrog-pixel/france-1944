#!/usr/bin/env python3
"""Writes data/air/airfields-1944.json and data/air/fleet-1944.json.
Allied advanced landing grounds come from the Wikipedia 'Advanced landing ground' tables (sources/raw), which transcribe
Johnson (1988), U.S. Army Air Forces Continental Airfields (ETO), AFHRA, for the US fields. Fleet and Luftwaffe strength
come from Ellis vol. I and Craven and Cate vol. III."""
import re, json, datetime
from pyproj import Transformer
TR = Transformer.from_crs(4326, 2154, always_xy=True)
def game(lon, lat):
    x, y = TR.transform(lon, lat); return [round(x / 1000 - 100, 2), round(7110 - y / 1000, 2)]
def inside(p): return 0 <= p[0] <= 820 and 0 <= p[1] <= 450
W = open('sources/raw/wp-advanced-landing-ground.txt').read()
MON = {m: i for i, m in enumerate(['January','February','March','April','May','June','July','August','September','October','November','December'], 1)}
def pdate(s):
    m = re.search(r'(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (19\d\d)', s or '')
    return '%s-%02d-%02d' % (m.group(3), MON[m.group(2)], int(m.group(1))) if m else None
def coord(s):
    m = re.search(r'\{\{\s*[Cc]oord\|(\d+)\|(\d+)\|(\d+(?:\.\d+)?)\|([NS])\|(\d+)\|(\d+)\|(\d+(?:\.\d+)?)\|([EW])', s)
    if not m: return None
    la = int(m.group(1)) + int(m.group(2)) / 60 + float(m.group(3)) / 3600; lo = int(m.group(5)) + int(m.group(6)) / 60 + float(m.group(7)) / 3600
    return (-lo if m.group(8) == 'W' else lo, -la if m.group(4) == 'S' else la)
def clean(s):
    s = re.sub(r'<ref[^>]*/>|<ref.*?</ref>', '', s, flags=re.S); s = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', s)
    return re.sub(r'\s+', ' ', re.sub(r'\{\{[^}]*\}\}', '', s)).strip()
sections = [(m.start(), m.group(1).strip()) for m in re.finditer(r'^=+\s*([^=]+?)\s*=+\s*$', W, re.M)]
def section_of(pos): return [n for p, n in sections if p <= pos][-1]
fields = []
bounds = sorted(set([m.start() for m in re.finditer(r'\n\|-', W)] + [m.start() for m in re.finditer(r'\n\*', W)] + [p for p, _ in sections]))
import bisect
for m in re.finditer(r'\{\{\s*[Cc]oord\|[^}]*?name\s*=\s*([^}|]+)\}\}', W):
    nm = m.group(1).strip()
    if nm.startswith('ELS Poupeville'): nm = 'ELS-1 Poupeville'
    cm = re.match(r'(ELS-?\s?\d+|[AB]-\s?\d+[A-Z]?)\b', nm)
    if not cm: continue
    code = cm.group(1).replace(' ', '')
    if code.startswith('ELS') and '-' not in code: code = 'ELS-' + code[3:]
    i = bisect.bisect_right(bounds, m.start()) - 1; j = bisect.bisect_right(bounds, m.start())
    blk = W[bounds[i] if i >= 0 else 0: bounds[j] if j < len(bounds) else len(W)]
    sec = section_of(m.start())
    if sec not in ('Normandy campaign', 'Cotentin Peninsula/Brittany Breakout', 'Drive to the Seine River', 'Pursuit to the German border', 'Royal Air Force ALGs'): continue
    c = coord(m.group(0))
    if not c: continue
    op = re.search(r'Opened:\s*([^\n<]*)', blk); cap = re.search(r'Captured:\s*([^\n<]*)', blk)
    d0 = None
    if op:   # 'Opened: 11 September - 10 May 1944' or '27 August - 4 November 1944': first day and month, year from the field
        mo = re.search(r'(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December)', op.group(1)); yo = re.search(r'19\d\d', op.group(1))
        if mo and yo: d0 = '%s-%02d-%02d' % (yo.group(0), MON[mo.group(2)], int(mo.group(1)))
    if not d0:
        dl = re.findall(r'\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) 19\d\d', blk)
        d0 = pdate(dl[0]) if dl else None
    note = 'captured ' + pdate(cap.group(1)) if cap and pdate(cap.group(1)) else ''
    mm = re.search(r'D\+(\d+)', blk)
    if not d0 and mm: d0 = (datetime.date(1944, 6, 6) + datetime.timedelta(days=int(mm.group(1)))).isoformat(); note = 'operational on D+%s' % mm.group(1)
    p = game(*c)
    if not inside(p): continue
    place = re.sub(r'^(ELS-?\s?\d+|[AB]-\s?\d+[A-Z]?)\s*', '', nm).strip()
    fields.append({'code': code, 'name': place, 'side': 0, 'nat': 'US' if code.startswith(('A', 'ELS')) else 'UK', 'xy': p, 'lonlat': [round(c[0], 4), round(c[1], 4)],
                   'open': d0, 'section': sec, 'note': note})
# coordinate fixes: two US entries carry coordinates far from the place they name (checked against data/network/towns.json)
FIX = {'A-51': ('Morlaix', 'coordinates in the table lie 563 km from Morlaix; placed at the town (inference)'),
       'A-52': ('Étampes', 'coordinates in the table lie 104 km from Etampes; placed at the town, Mondesir field lies just southwest (inference)')}
TW = {t['name']: t for t in json.load(open('data/network/towns.json'))['towns']}
for f in fields:
    if f['code'] in FIX:
        t = TW[FIX[f['code']][0]]; f['xy'] = [t['x'], t['y']]; f['note'] = (f['note'] + '; ' if f['note'] else '') + FIX[f['code']][1]; f['fixed'] = True
seen = {}; out = []
for f in fields:
    if f['code'] in seen: continue
    seen[f['code']] = 1
    if f['open'] and f['open'] > '1944-09-01': continue
    if f['code'] == 'A-56': f['note'] = (f['note'] + '; ' if f['note'] else '') + 'opening date looks early for a field near Amiens, which the Allies reached on 31 August (verify)'; f['fixed'] = True
    if not f['open'] and int(re.sub(r'\D', '', f['code'].split('-')[1]) or 0) > 30: continue   # RAF fields past B-30 opened after August (inference from the numbering)
    f['status'] = 'sourced' if f['open'] and not f.get('fixed') else 'verify'
    f['src'] = ['wp-alg'] + (['johnson-1988'] if f['nat'] == 'US' else [])
    if not f['open'] and f['nat'] == 'UK': f['note'] = (f['note'] + '; ' if f['note'] else '') + 'no opening date in the table; Ellis gives 23 RAF airfields in use by the end of August'
    out.append(f)
out.sort(key=lambda f: (f['open'] or '9999', f['code']))
# ---- German-held airfields: fields the table marks as captured, plus established prewar airfields among the Allied list
PREWAR = {'A-27': 'Rennes/St-Jacques', 'A-33': 'Vannes', 'A-35': 'Le Mans', 'A-39': 'Chateaudun', 'A-40': 'Chartres', 'A-41': 'Dreux', 'A-42': 'Villacoublay', 'A-47': 'Orly',
          'A-48': 'Bretigny', 'A-50': 'Orleans/Bricy', 'A-52': 'Etampes/Mondesir', 'A-54': 'Le Bourget', 'A-57': 'Laval', 'B-17': 'Caen/Carpiquet', 'B-28': 'Evreux', 'B-24': "St-Andre-de-l'Eure"}
german = []
for f in fields:
    cap = re.search(r'captured (\d{4}-\d\d-\d\d)', f['note'] or '')
    if not (cap or f['code'] in PREWAR): continue
    if any(g['code'] == f['code'] for g in german): continue
    until = cap.group(1) if cap else f['open']
    st, why = ('sourced', 'the table gives the date it was captured') if cap else ('inference', 'established airfield; held by the Germans until the Allies took the area, the date taken as the first Allied use')
    if f['code'] == 'B-17': until, st, why = '1944-07-09', 'inference', 'the RAF table says captured from German forces in July 1944 during the battle for Caen; day from Ellis account of Carpiquet (verify)'
    if f['code'] == 'B-24': st, why = 'verify', 'Luftwaffe base from general history'
    if f['code'] == 'B-28': st, why = 'verify', 'French Air Force base (Evreux-Fauville) per the table; German use and capture date from general history'
    german.append({'code': f['code'], 'name': f['name'], 'side': 1, 'xy': f['xy'], 'heldUntil': until, 'status': st, 'note': why, 'src': ['wp-alg']})
german.sort(key=lambda g: (g['heldUntil'] or '9999'))
air = {'title': 'Allied advanced landing grounds in the slice, opened by 1 September 1944', 'author': 'Tov Binyamin Brog', 'coords': 'game km (data/README.md)',
  'sources': [
   {'id': 'wp-alg', 'title': 'Wikipedia, Advanced landing ground (wikitext, sources/raw/wp-advanced-landing-ground.txt)', 'url': 'https://en.wikipedia.org/wiki/Advanced_landing_ground', 'read': '2026-11-22', 'free': True,
    'note': 'Secondary. The US tables cite Johnson (1988); the RAF table cites aerosteles.net and other sites.'},
   {'id': 'johnson-1988', 'title': 'David C. Johnson, U.S. Army Air Forces Continental Airfields (ETO), D-Day to V-E Day, AFHRA 1988', 'read': None, 'free': True,
    'note': 'Cited by the Wikipedia tables; the AFHRA PDF could not be downloaded on 22 Nov 2026, so the figures are not yet checked against it.'},
   {'id': 'aaf-iii', 'title': 'Craven and Cate, The Army Air Forces in World War II, vol. III', 'url': 'https://archive.org/details/Vol3EuropeArgumentToVEDay', 'read': '2026-11-22', 'free': True},
   {'id': 'ellis-1', 'title': 'L. F. Ellis, Victory in the West, vol. I (1962)', 'url': 'https://archive.org/details/victory-west-vol-1', 'read': '2026-11-22', 'free': True}],
  'notes': ['open is the date the table gives the field as opened or operational. RAF fields mostly lack dates; B-1 to B-30 are kept as Normandy and Seine fields (inference from the sequential numbering) and marked verify.',
            'Engine use: these are the historical sites. The engine still builds airfields where engineers are sent (air.js); a scenario can seed fields on their historical opening date.'],
  'checks': ['Craven and Cate vol. III: the IX Engineer Command plan called for two emergency strips on D-Day, two refuelling and rearming strips on Omaha by D+3, four advanced landing grounds on Omaha and one on Utah by D+8, and five on Omaha and three on Utah by D+14; the Utah emergency strip at Hebert was finished at 2115 on D-Day.',
             'Ellis vol. I: by the end of August 23 airfields had been built or repaired for 83 and 84 Groups RAF.'],
  'fields': out,
  'german': german}
json.dump(air, open('data/air/airfields-1944.json', 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(len(out), Counter(f['nat'] for f in out), Counter(f['status'] for f in out)); print('german', len(german), Counter(g['status'] for g in german))
for f in out[:8]: print(f['code'], f['name'], f['open'], f['xy'])
print('by 20 Jun:', sum(1 for f in out if f['open'] and f['open'] <= '1944-06-20'), ' by 1 Sep US:', sum(1 for f in out if f['nat']=='US' and f['open']))

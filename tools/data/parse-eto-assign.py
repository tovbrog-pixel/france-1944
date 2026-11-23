#!/usr/bin/env python3
"""Parse the 'Assignment and Attachment to Higher Units' tables of the 1945 ETO order of battle (OCR text)
into dated rows: date, corps, army, army group. Prints rows to 1 Sep 1944 for the slice divisions as JSON."""
import re, json, sys
L = open('sources/archive/OrderOfBattleUsArmyEtoWw2__OrderOfBattleUsArmyEtoWw2_djvu.txt').read().split('\n')
MON = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}
DRE = re.compile(r'\b([0-9IlSO]{1,2})\s*[\.,]?\s*([JjFfMmAaSsOoNnDd][a-zA-Z]{2})[a-z]*\.?\s*[\'\.,]?\s*(4[0-5])\b')
CORPS = ['XXIII', 'XVIII', 'XXII', 'XIII', 'XVI', 'XIX', 'XXI', 'VIII', 'VII', 'XII', 'XV', 'XX', 'III', 'II', 'IV', 'VI', 'IX', 'V', 'X', 'I']
ARMY = ['First', 'Third', 'Ninth', 'Seventh', 'Fifteenth', 'Second Br', 'First Cdn', 'First Fr']
def fixnum(s): return int(s.replace('I', '1').replace('l', '1').replace('S', '5').replace('O', '0'))
heads = []
for i, l in enumerate(L):
    m = re.search(r'(\d{1,3})\s*(?:st|nd|rd|th|d)\.?\s+(Infantry|Armored|Airborne)\s+Division', l, re.I)
    if m: heads.append((i, m.group(1) + ' ' + m.group(2)[:3].lower()))
starts = [i for i, l in enumerate(L) if re.search(r'ASSIGN', l)]
out = {}
for st in starts:
    h = [n for i, n in heads if i <= st and i > st - 12]
    if not h: continue
    div = h[-1]
    text = ' | '.join(' '.join(L[k].split()) for k in range(st, min(len(L), st + 140)) if L[k].strip())
    toks = [t.strip() for t in text.split('|') if t.strip()]
    rows = []; cur = None
    for t in toks:
        m = DRE.search(t)
        if m and m.group(2)[:3].lower() in MON:
            try: d = '19%s-%02d-%02d' % (m.group(3), MON[m.group(2)[:3].lower()], fixnum(m.group(1)))
            except ValueError: continue
            cur = {'date': d, 'corps': None, 'army': None, 'group': None, 'raw': []}; rows.append(cur)
            rest = t[m.end():]
        else: rest = t
        if cur is None: continue
        cur['raw'].append(rest)
        w = re.sub(r'[^A-Za-z0-9 ]', ' ', rest)
        if cur['corps'] is None:
            for c in CORPS:
                if re.search(r'(^|\s)' + c + r'(\s|$)', w): cur['corps'] = c; break
        if cur['army'] is None:
            for a in ARMY:
                if a.split()[0] in w: cur['army'] = a; break
        if cur['group'] is None:
            mg = re.search(r'\b(12th|21st|6th)\b', w)
            if mg: cur['group'] = mg.group(1)
    if div not in out: out[div] = rows
res = {d: [{k: v for k, v in r.items() if k != 'raw'} for r in rows if '1943-10-01' <= r['date'] <= '1944-09-01'] for d, rows in out.items()}
json.dump(res, sys.stdout, indent=0)

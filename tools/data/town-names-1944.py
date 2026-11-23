#!/usr/bin/env python3
"""1944 town names from INSEE's Code officiel géographique: the commune name in force on 6 June 1944 for each town's INSEE code
(sources/insee/v_commune_depuis_1943.csv, COG 2026, Licence Ouverte / Etalab). A merged commune keeps its former chief town's code,
so the 1944 name for that code is the chief town's. Towns whose code did not exist in 1944 keep Claude's list (inference).
Writes data/network/town-names-1944.json.   python3 tools/data/town-names-1944.py"""
import csv, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
D = '1944-06-06'
by = {}
for r in csv.DictReader(open(ROOT / 'sources/insee/v_commune_depuis_1943.csv', encoding='utf-8')):
    if r['TYPECOM'] == 'COM' and r['DATE_DEBUT'] <= D and (not r['DATE_FIN'] or r['DATE_FIN'] > D): by[r['COM']] = r['LIBELLE']
towns = json.load(open(ROOT / 'data/network/towns.json'))['towns']
prev = json.load(open(ROOT / 'data/network/town-names-1944.json'))
claude = prev.get('byName') or prev.get('names') or {}
byCode, byName = {}, {}
for t in towns:
    n = by.get(t['insee'])
    if n and n != t['name']: byCode[t['insee']] = n
    elif not n and t['name'] in claude: byName[t['name']] = claude[t['name']]
out = {'author': 'Tov Binyamin Brog',
       'note': 'Town names in force on 6 June 1944. byCode: from INSEE, Code officiel géographique 2026, "communes depuis 1943" (Licence Ouverte / Etalab), by each town\'s INSEE code. byName: towns whose code did not exist in 1944, from Claude\'s list (inference). towns.json keeps today\'s names.',
       'byCode': dict(sorted(byCode.items())), 'byName': byName}
json.dump(out, open(ROOT / 'data/network/town-names-1944.json', 'w'), ensure_ascii=False, indent=1)
print('renamed by INSEE code:', len(byCode), '| from Claude\'s list:', len(byName), '| towns:', len(towns))

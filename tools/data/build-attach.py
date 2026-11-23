#!/usr/bin/env python3
"""Writes data/oob/attachments-1944.json: which corps and army each Allied division served under, by date, to 1 Sep 1944.
US rows are transcribed by hand from the 'Assignment and Attachment to Higher Units' tables of the 1945 ETO order of
battle (OCR text read with tools/data/parse-eto-assign.py). Where the table names an attached army as well as an
assigned one, the attached (operational) army is recorded. British, Canadian and Polish rows are snapshots from Ellis."""
import json
READ = '2026-11-22'
# division id: [(date, corps, army, status, note)]
US = {
 'us-1id':  [('1944-02-02','V','First','sourced',''), ('1944-07-14',None,'First','sourced','army reserve'), ('1944-07-15','VII','First','sourced','')],
 'us-2id':  [('1944-04-14','V','First','sourced',''), ('1944-08-17','XIX','First','sourced',''), ('1944-08-18','VIII','Third','sourced','assigned First, attached Third (Brest)')],
 'us-4id':  [('1944-02-02','VII','First','sourced',''), ('1944-07-16','VIII','First','sourced',''), ('1944-07-19','VII','First','sourced',''), ('1944-08-22','V','First','sourced','')],
 'us-5id':  [('1944-07-13','V','First','sourced',''), ('1944-08-04','XX','Third','sourced','')],
 'us-8id':  [('1944-07-01','VIII','First','sourced',''), ('1944-08-01','VIII','Third','sourced','')],
 'us-9id':  [('1944-06-10','VII','First','verify','table illegible in the OCR; VII Corps from the Blumenson narrative of the Cherbourg and Cobra fighting')],
 'us-28id': [('1944-07-26','XIX','First','sourced','assigned Third, attached First'), ('1944-08-28','V','First','sourced','')],
 'us-29id': [('1943-10-22','V','First','sourced',''), ('1944-06-14','XIX','First','sourced',''), ('1944-08-12','V','First','sourced',''), ('1944-08-19','VIII','Third','sourced','assigned First, attached Third (Brest)')],
 'us-30id': [('1944-02-18','XIX','First','sourced',''), ('1944-07-15','VII','First','sourced',''), ('1944-07-28','XIX','First','sourced',''), ('1944-08-04','V','First','sourced',''), ('1944-08-05','VII','First','sourced',''), ('1944-08-13','XIX','First','sourced',''), ('1944-08-26','XV','First','sourced',''), ('1944-08-29','XIX','First','sourced','')],
 'us-35id': [('1944-07-08','XIX','First','verify','day of the month lost in the OCR; arrival date used'), ('1944-07-27','V','First','verify','OCR shows "2? Jul"; Blumenson to confirm'), ('1944-08-06','XX','Third','sourced',''), ('1944-08-09','VII','First','sourced','assigned Third, attached First (Mortain)'), ('1944-08-13','XII','Third','sourced','')],
 'us-79id': [('1944-05-29','VII','First','sourced','assigned Third, attached First'), ('1944-07-01','VIII','First','sourced','assigned Third, attached First'), ('1944-08-01','VIII','Third','verify','corps garbled in the OCR'), ('1944-08-03','XV','Third','sourced',''), ('1944-08-26','XV','First','sourced',''), ('1944-08-29','XIX','First','sourced','')],
 'us-80id': [('1944-08-01','XII','Third','verify','corps garbled in the OCR ("XIT")'), ('1944-08-07','XX','Third','sourced',''), ('1944-08-08','XV','Third','sourced',''), ('1944-08-10','XX','Third','sourced',''), ('1944-08-17','V','First','verify','OCR shows "1 Aug"; the row falls between 10 and 23 Aug'), ('1944-08-23',None,'Third','sourced',''), ('1944-08-26','XII','Third','sourced','')],
 'us-82ab': [('1944-06-06','VII','First','sourced',''), ('1944-06-19','VIII','First','verify','OCR shows "9 Jun"; VIII Corps entered the line in mid-June'), ('1944-07-13',None,'Ninth','sourced','left the Continent for England')],
 'us-83id': [('1944-06-25','VIII','First','sourced','assigned Third, attached First'), ('1944-07-01','VII','First','sourced',''), ('1944-07-15','VIII','First','sourced',''), ('1944-08-01','XV','Third','sourced',''), ('1944-08-03','VIII','Third','sourced','')],
 'us-90id': [('1944-03-27','VII','First','sourced','assigned Third, attached First'), ('1944-06-19','VIII','First','sourced',''), ('1944-08-02','XV','Third','verify','date lost in the OCR; XV Corps took the division in early August (Blumenson)'), ('1944-08-17','V','First','sourced','assigned Third, attached First (Chambois)'), ('1944-08-25','XV','Third','sourced',''), ('1944-08-26','XX','Third','sourced','')],
 'us-101ab':[('1944-06-06','VII','First','sourced',''), ('1944-06-15','VIII','First','sourced','corps and date columns read in order'), ('1944-07-15',None,'Ninth','sourced','left the Continent for England')],
 'us-2ad':  [('1944-02-03','XIX','First','sourced',''), ('1944-06-12','V','First','sourced',''), ('1944-07-18','VII','First','sourced',''), ('1944-08-02',None,'First','sourced','army reserve'), ('1944-08-07','VII','First','sourced',''), ('1944-08-13','XIX','First','sourced',''), ('1944-08-19','XIX','First','sourced','a V Corps row between 13 and 19 Aug has a damaged day'), ('1944-08-28','XV','First','sourced',''), ('1944-08-29','XIX','First','sourced','')],
 'us-3ad':  [('1944-02-08','XIX','First','sourced',''), ('1944-07-01','VII','First','sourced','')],
 'us-4ad':  [('1944-07-15','VIII','First','sourced','assigned Third, attached First'), ('1944-08-01','VIII','Third','sourced',''), ('1944-08-13','XII','Third','sourced','')],
 'us-5ad':  [('1944-06-01','XII','Third','sourced',''), ('1944-08-01','XV','Third','sourced',''), ('1944-08-26','XV','First','sourced',''), ('1944-08-29','V','First','sourced','')],
 'us-6ad':  [('1944-07-25','VIII','First','sourced',''), ('1944-08-01','VIII','Third','sourced','')],
 'us-7ad':  [('1944-07-30',None,'First','sourced',''), ('1944-08-05',None,'Third','sourced',''), ('1944-08-10','XX','Third','sourced','')],
 'fr-2db':  [('1944-08-01','XX','Third','sourced',''), ('1944-08-09','XV','Third','sourced','Blumenson: attached to XV Corps at le Mans on 9 Aug; the table row of 8 Aug has no corps'), ('1944-08-17','V','First','sourced','assigned Third, attached First')],
}
# Ellis snapshots: (date, corps, army, [division ids], page, note)
UK = [
 ('1944-06-06','I','Second',['uk-3id','ca-3id','uk-6ab'],'80','assault organisation; 6th Airborne under I Corps after landing'),
 ('1944-06-06','XXX','Second',['uk-50id'],'167','the leading division of XXX Corps in the Gold area'),
 ('1944-06-10','I','Second',['uk-51id'],'245','51st passed into the bridgehead east of the Orne'),
 ('1944-06-10','XXX','Second',['uk-7ad'],'245','7th Armoured launched toward Villers-Bocage'),
 ('1944-06-25','XXX','Second',['uk-49id'],'276','49th Division in XXX Corps preliminary attack'),
 ('1944-06-26','VIII','Second',['uk-15id','uk-43id','uk-11ad'],'275','Epsom'),
 ('1944-07-25','II Canadian','Second',['uk-7ad','uk-gds-ad'],'378','Spring: II Canadian Corps strengthened by 7th Armoured and Guards Armoured'),
 ('1944-07-25','II Canadian','Second',['ca-2id','ca-3id'],'378','Spring: Canadian divisions of the corps from the narrative (verify)'),
 ('1944-07-23','I','First Canadian',['uk-3id','uk-51id','uk-6ab'],'375','First Canadian Army operational on 23 July, taking the British I Corps under command; the divisions in I Corps that day from the narrative (verify)'),
 ('1944-07-30','VIII','Second',['uk-15id','uk-11ad','uk-gds-ad'],'388','Bluecoat'),
 ('1944-07-30','XXX','Second',['uk-7ad','uk-43id','uk-50id'],'388','Bluecoat: 7th Armoured in XXX Corps reserve, XXX Corps\' 43rd Division, and the 50th on its left'),
 ('1944-08-03','XII','Second',['uk-53id','uk-59id'],'408',''),
 ('1944-08-07','II Canadian','First Canadian',['ca-2id','ca-3id','ca-4ad','uk-51id','pl-1ad'],'417','Totalize; 51st from I Corps'),
 ('1944-08-17','XII','Second',['uk-53id','uk-59id'],'445',''),
 ('1944-08-17','XXX','Second',['uk-11ad'],'445','VIII Corps pinched out'),
 ('1944-08-17','II Canadian','First Canadian',['ca-4ad','pl-1ad'],'441','the two armoured divisions of II Canadian Corps'),
 ('1944-08-25','XXX','Second',['uk-43id'],'454','Seine crossing at Vernon'),
]
rows = []
for d, lst in US.items():
    for date, corps, army, st, note in lst:
        rows.append({'div': d, 'from': date, 'corps': corps, 'army': army, 'status': st, 'src': ['eto-oob'] + (['blumenson'] if 'Blumenson' in note else []), 'note': note})
for date, corps, army, divs, pg, note in UK:
    for d in divs:
        rows.append({'div': d, 'from': date, 'corps': corps, 'army': army, 'status': 'verify' if 'verify' in note else 'sourced', 'src': ['ellis-1'], 'cite': 'ellis-1 p. ' + pg, 'note': note,
                     'snapshot': True})
out = {
 'title': 'Allied division attachments to corps and armies, 6 June to 1 September 1944', 'author': 'Tov Binyamin Brog',
 'sources': [
  {'id': 'eto-oob', 'title': 'Order of Battle of the US Army, WWII, ETO: Divisions (1945), Assignment and Attachment to Higher Units tables', 'url': 'https://archive.org/details/OrderOfBattleUsArmyEtoWw2', 'read': READ, 'free': True},
  {'id': 'ellis-1', 'title': 'L. F. Ellis, Victory in the West, vol. I (1962)', 'url': 'https://archive.org/details/victory-west-vol-1', 'read': READ, 'free': True},
  {'id': 'blumenson', 'title': 'Martin Blumenson, Breakout and Pursuit (1961)', 'url': 'https://archive.org/details/breakoutpursuit00blum', 'read': READ, 'free': True}],
 'notes': ['US rows: each row holds from its date until the next row for the same division. The army is the operational (attached) one where the table gives two.',
           'British, Canadian and Polish rows (snapshot: true) record a corps the division served in on that date as Ellis describes an operation; the division may have joined earlier. A continuous record needs Joslen or the war diaries.',
           'Page numbers come from the running heads of the OCR text and may be one or two pages off.'],
 'rows': sorted(rows, key=lambda r: (r['div'], r['from'])),
}
json.dump(out, open('data/oob/attachments-1944.json', 'w'), indent=1)
from collections import Counter
print(len(rows), Counter(r['status'] for r in rows))

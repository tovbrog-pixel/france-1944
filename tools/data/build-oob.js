// Writes data/oob/allied-1944.json and data/oob/german-1944.json from the tables below.
// Each row: [id, name, nat, tpl, regiments, commanders [[from, name]], arrival, status, src, note]
const fs = require('fs'), path = require('path');
const READ = '2026-11-22';
const SOURCES = [
  { id: 'eto-oob', title: 'Order of Battle of the United States Army, World War II, European Theater of Operations: Divisions. Office of the Theater Historian, Paris, December 1945', url: 'https://archive.org/details/OrderOfBattleUsArmyEtoWw2', read: READ, free: true, note: 'Public domain. Division entries: Command and Staff, Statistics (Arrived Continent with D+ day), Composition, Attachments, Assignments. OCR text in sources/archive.' },
  { id: 'ellis-1', title: 'L. F. Ellis, Victory in the West, vol. I, The Battle of Normandy, HMSO 1962', url: 'https://archive.org/details/victory-west-vol-1', read: READ, free: true, note: 'Appendix IV, The Allied Armies (pp. 521-551): formations engaged 6 Jun-31 Aug 1944 with commanders and dates of change. Appendix V (pp. 552-555): German command and the 13 corps and 51 divisions met. OCR text in sources/archive.' },
  { id: 'blumenson', title: 'Martin Blumenson, Breakout and Pursuit, US Army in World War II, CMH 1961', url: 'https://archive.org/details/breakoutpursuit00blum', read: READ, free: true, note: 'OCR text in sources/archive.' },
  { id: 'general', title: 'General history, not yet traced to a primary source', read: READ, free: false, note: 'Every record citing only this source has status verify.' },
];
const D = (s) => s;   // dates as ISO strings
// ---------- United States: arrival dates and D+ days from eto-oob Statistics; commanders from eto-oob Command and Staff where legible
const US = [
  ['us-1id', '1st Infantry Division', 'US', 'us_inf', ['16th Inf', '18th Inf', '26th Inf'], [['1943-11-05', 'Maj. Gen. Clarence R. Huebner']], '1944-06-06', 'sourced', ['eto-oob'], 'D-Day, Omaha'],
  ['us-2id', '2nd Infantry Division', 'US', 'us_inf', ['9th Inf', '23rd Inf', '38th Inf'], [['1943', 'Maj. Gen. Walter M. Robertson']], '1944-06-08', 'sourced', ['eto-oob'], 'Arrived Continent D+2; commander date to read from the Command and Staff page'],
  ['us-4id', '4th Infantry Division', 'US', 'us_inf', ['8th Inf', '12th Inf', '22nd Inf'], [['1944-01-28', 'Maj. Gen. Raymond O. Barton']], '1944-06-06', 'sourced', ['eto-oob'], 'D-Day, Utah'],
  ['us-5id', '5th Infantry Division', 'US', 'us_inf', ['2nd Inf', '10th Inf', '11th Inf'], [['1943', 'Maj. Gen. S. LeRoy Irwin']], '1944-07-09', 'sourced', ['eto-oob'], 'Arrived Continent D+33; first elements in combat 14 Jul 1944'],
  ['us-8id', '8th Infantry Division', 'US', 'us_inf', ['13th Inf', '28th Inf', '121st Inf'], [['1944', 'Maj. Gen. William C. McMahon'], ['1944-07', 'Maj. Gen. Donald A. Stroh']], '1944-07-04', 'sourced', ['eto-oob'], 'Arrived Continent D+28. Commanders: names to confirm on the Command and Staff page (status of commanders: verify)'],
  ['us-9id', '9th Infantry Division', 'US', 'us_inf', ['39th Inf', '47th Inf', '60th Inf'], [['1943', 'Maj. Gen. Manton S. Eddy'], ['1944-08-19', 'Maj. Gen. Louis A. Craig']], '1944-06-10', 'sourced', ['eto-oob', 'blumenson'], 'Arrived Continent D+4; entered combat 14 Jun 1944. Craig took over when Eddy went to XII Corps (Blumenson); exact date verify'],
  ['us-28id', '28th Infantry Division', 'US', 'us_inf', ['109th Inf', '110th Inf', '112th Inf'], [['1944', 'Maj. Gen. Lloyd D. Brown'], ['1944-08', 'Maj. Gen. Norman D. Cota']], '1944-07-24', 'sourced', ['eto-oob'], 'Arrived Continent D+48. Mid-August command changes (Brown, Wharton, Cota) to read from Command and Staff'],
  ['us-29id', '29th Infantry Division', 'US', 'us_inf', ['115th Inf', '116th Inf', '175th Inf'], [['1943-07-22', 'Maj. Gen. Charles H. Gerhardt']], '1944-06-06', 'sourced', ['eto-oob'], 'D-Day, Omaha. Gerhardt name not legible in OCR; the 22 Jul 1943 date is (commander status: verify)'],
  ['us-30id', '30th Infantry Division', 'US', 'us_inf', ['117th Inf', '119th Inf', '120th Inf'], [['1944', 'Maj. Gen. Leland S. Hobbs']], '1944-06-14', 'sourced', ['eto-oob'], 'Arrived Continent D+8 (OCR "2/ 8"; date line 14 Jun 44 in the column)'],
  ['us-35id', '35th Infantry Division', 'US', 'us_inf', ['134th Inf', '137th Inf', '320th Inf'], [['1944-05-26', 'Maj. Gen. Paul W. Baade']], '1944-07-08', 'sourced', ['eto-oob'], 'Arrived Continent D+32; entered combat 11 Jul 1944'],
  ['us-79id', '79th Infantry Division', 'US', 'us_inf', ['313th Inf', '314th Inf', '315th Inf'], [['1944', 'Maj. Gen. Ira T. Wyche']], '1944-06-14', 'sourced', ['eto-oob'], 'Arrived Continent D+8; entered combat 19 Jun 1944. Commander name not legible in OCR (commander status: verify)'],
  ['us-80id', '80th Infantry Division', 'US', 'us_inf', ['317th Inf', '318th Inf', '319th Inf'], [['1944', 'Maj. Gen. Horace L. McBride']], '1944-08-03', 'sourced', ['eto-oob'], 'Arrived Continent D+58; entered combat 3 Aug 1944'],
  ['us-82ab', '82nd Airborne Division', 'US', 'us_abn', ['505th PIR', '507th PIR', '508th PIR', '325th GIR'], [['1943-12-09', 'Maj. Gen. Matthew B. Ridgway'], ['1944-08-26', 'Brig. Gen. James M. Gavin']], '1944-06-06', 'sourced', ['eto-oob'], 'D-Day, airborne. 507th and 508th PIR attached for Normandy'],
  ['us-83id', '83rd Infantry Division', 'US', 'us_inf', ['329th Inf', '330th Inf', '331st Inf'], [['1944-04-19', 'Maj. Gen. Robert C. Macon']], '1944-06-19', 'sourced', ['eto-oob'], 'Arrived Continent D+13; entered combat 27 Jun 1944'],
  ['us-90id', '90th Infantry Division', 'US', 'us_inf', ['357th Inf', '358th Inf', '359th Inf'], [['1944-04-05', 'Brig. Gen. Jay W. MacKelvie'], ['1944-06-13', 'Maj. Gen. Eugene M. Landrum'], ['1944-07-30', 'Brig. Gen. Raymond S. McLain']], '1944-06-08', 'sourced', ['eto-oob'], 'Arrived Continent D+2; first elements in combat 6 Jun, entire division 10 Jun 1944'],
  ['us-101ab', '101st Airborne Division', 'US', 'us_abn', ['501st PIR', '502nd PIR', '506th PIR', '327th GIR'], [['1944', 'Maj. Gen. Maxwell D. Taylor']], '1944-06-06', 'sourced', ['eto-oob'], 'D-Day, airborne'],
  ['us-2ad', '2nd Armored Division', 'US', 'us_arm', ['CCA', 'CCB', 'CCR'], [['1944', 'Maj. Gen. Edward H. Brooks']], '1944-06-09', 'sourced', ['eto-oob'], 'Arrived Continent D+3. Commander date to read from Command and Staff'],
  ['us-3ad', '3rd Armored Division', 'US', 'us_arm', ['CCA', 'CCB', 'CCR'], [['1944', 'Maj. Gen. Leroy H. Watson'], ['1944-08', 'Maj. Gen. Maurice Rose']], '1944-06-24', 'sourced', ['eto-oob'], 'Arrived Continent D+18. Watson-Rose change date to read from Command and Staff'],
  ['us-4ad', '4th Armored Division', 'US', 'us_arm', ['CCA', 'CCB', 'CCR'], [['1944-01-11', 'Maj. Gen. John S. Wood']], '1944-07-13', 'sourced', ['eto-oob'], 'Arrived Continent D+37'],
  ['us-5ad', '5th Armored Division', 'US', 'us_arm', ['CCA', 'CCB', 'CCR'], [['1944', 'Maj. Gen. Lunsford E. Oliver']], '1944-07-25', 'sourced', ['eto-oob'], 'Arrived Continent D+49; entered combat 2 Aug 1944'],
  ['us-6ad', '6th Armored Division', 'US', 'us_arm', ['CCA', 'CCB', 'CCR'], [['1944', 'Maj. Gen. Robert W. Grow']], '1944-07-18', 'sourced', ['eto-oob'], 'Arrived Continent D+42; first elements in combat 27 Jul, entire division 28 Jul 1944'],
  ['us-7ad', '7th Armored Division', 'US', 'us_arm', ['CCA', 'CCB', 'CCR'], [['1944-06-13', 'Maj. Gen. Lindsay M. Silvester']], '1944-08-10', 'sourced', ['eto-oob'], 'Arrived Continent D+65; first elements in combat 13 Aug 1944'],
  ['fr-2db', '2e Division Blindee', 'FR', 'us_arm', ['GT Langlade', 'GT Dio', 'GT Billotte'], [['1944', 'Maj. Gen. Jacques Philippe Leclerc']], '1944-08-01', 'verify', ['blumenson'], 'Blumenson: re-equipped with American materiel, arrived on the Continent and assembled south of Avranches in the early days of August; attached to XV Corps at le Mans on 9 Aug. Exact landing date verify; group names from general history'],
];
// ---------- British, Canadian, Polish: names, commanders and dates of change from ellis-1 Appendix IV. Arrival dates verify unless noted.
const CW = [
  ['uk-gds-ad', 'Guards Armoured Division', 'UK', 'uk_arm', ['5th Guards Armoured Bde', '32nd Guards Bde'], [['1944-06', 'Maj. Gen. A. H. S. Adair']], '1944-06-28', 'verify', ['ellis-1', 'general'], 'Ellis: 32nd Guards Brigade arrived as forerunner by Epsom (late June); division date to verify in Joslen'],
  ['uk-7ad', '7th Armoured Division', 'UK', 'uk_arm', ['22nd Armoured Bde', '131st Infantry Bde'], [['1944-06', 'Maj. Gen. G. W. E. J. Erskine'], ['1944-08-04', 'Maj. Gen. G. L. Verney']], '1944-06-07', 'verify', ['ellis-1'], 'Ellis: fighting echelons with Force L, the first follow-up convoy, due to land on the second tide after D-Day'],
  ['uk-11ad', '11th Armoured Division', 'UK', 'uk_arm', ['29th Armoured Bde', '159th Infantry Bde'], [['1944-06', 'Maj. Gen. G. P. B. Roberts']], '1944-06-13', 'verify', ['ellis-1', 'general'], 'Ellis: VIII Corps had only just landed before Epsom (26 Jun), divisions not quite complete; date to verify'],
  ['uk-3id', '3rd Infantry Division', 'UK', 'uk_inf', ['8th Bde', '9th Bde', '185th Bde'], [['1944-06', 'Maj. Gen. T. G. Rennie'], ['1944-06-13', 'Brig. E. E. E. Cass (acting)'], ['1944-06-23', 'Maj. Gen. L. G. Whistler']], '1944-06-06', 'sourced', ['ellis-1'], 'D-Day, Sword'],
  ['uk-6ab', '6th Airborne Division', 'UK', 'us_abn', ['3rd Parachute Bde', '5th Parachute Bde', '6th Airlanding Bde'], [['1944-06', 'Maj. Gen. R. N. Gale']], '1944-06-06', 'sourced', ['ellis-1'], 'D-Day, airborne, east of the Orne. Uses the US airborne template until a British one exists'],
  ['uk-15id', '15th (Scottish) Division', 'UK', 'uk_inf', ['44th (Lowland) Bde', '46th (Highland) Bde', '227th (Highland) Bde'], [['1944-06', 'Maj. Gen. G. H. A. MacMillan'], ['1944-08-03', 'Maj. Gen. C. M. Barber']], '1944-06-14', 'verify', ['ellis-1', 'general'], 'Ellis: VIII Corps had only just landed before Epsom; date to verify'],
  ['uk-43id', '43rd (Wessex) Division', 'UK', 'uk_inf', ['129th Bde', '130th Bde', '214th Bde'], [['1944-06', 'Maj. Gen. G. I. Thomas']], '1944-06-20', 'verify', ['ellis-1', 'general'], 'Ellis: its reconnaissance regiment ship arrived off Sword on the evening of 20 Jun; date to verify'],
  ['uk-49id', '49th (West Riding) Division', 'UK', 'uk_inf', ['70th Bde', '146th Bde', '147th Bde'], [['1944-06', 'Maj. Gen. E. H. Barker']], '1944-06-12', 'verify', ['ellis-1', 'general'], 'Ellis: part of the division arrived two days after its due date in mid-June; 56th Brigade joined 20 Aug 1944'],
  ['uk-50id', '50th (Northumbrian) Division', 'UK', 'uk_inf', ['69th Bde', '151st Bde', '231st Bde', '56th Bde'], [['1944-06', 'Maj. Gen. D. A. H. Graham']], '1944-06-06', 'sourced', ['ellis-1'], 'D-Day, Gold; 56th Brigade under command on D-Day'],
  ['uk-51id', '51st (Highland) Division', 'UK', 'uk_inf', ['152nd Bde', '153rd Bde', '154th Bde'], [['1944-06', 'Maj. Gen. D. C. Bullen-Smith'], ['1944-07-27', 'Maj. Gen. T. G. Rennie']], '1944-06-07', 'verify', ['ellis-1'], 'Ellis: 153rd Brigade landed with Force L, the first follow-up convoy; rest of division in the days after'],
  ['uk-53id', '53rd (Welsh) Division', 'UK', 'uk_inf', ['71st Bde', '158th Bde', '160th Bde'], [['1944-06', 'Maj. Gen. R. K. Ross']], '1944-06-27', 'verify', ['ellis-1', 'general'], 'Arrival date to verify'],
  ['uk-59id', '59th (Staffordshire) Division', 'UK', 'uk_inf', ['176th Bde', '177th Bde', '197th Bde'], [['1944-06', 'Maj. Gen. L. O. Lyne']], '1944-07-01', 'verify', ['ellis-1', 'general'], 'Ellis: to have landed by about 8 Jul for the attack on Caen; broken up late August'],
  ['ca-2id', '2nd Canadian Infantry Division', 'CA', 'uk_inf', ['4th Cdn Inf Bde', '5th Cdn Inf Bde', '6th Cdn Inf Bde'], [['1944-07', 'Maj. Gen. C. Foulkes']], '1944-07-07', 'verify', ['ellis-1', 'general'], 'Arrival date to verify in Stacey'],
  ['ca-3id', '3rd Canadian Infantry Division', 'CA', 'uk_inf', ['7th Cdn Inf Bde', '8th Cdn Inf Bde', '9th Cdn Inf Bde'], [['1944-06', 'Maj. Gen. R. F. L. Keller'], ['1944-08-18', 'Maj. Gen. D. C. Spry']], '1944-06-06', 'sourced', ['ellis-1'], 'D-Day, Juno. Keller to 8 Aug, Spry from 18 Aug'],
  ['ca-4ad', '4th Canadian Armoured Division', 'CA', 'uk_arm', ['4th Cdn Armoured Bde', '10th Cdn Infantry Bde'], [['1944-07', 'Maj. Gen. G. Kitching'], ['1944-08-22', 'Maj. Gen. H. W. Foster']], '1944-07-26', 'verify', ['ellis-1', 'general'], 'Arrival date to verify in Stacey'],
  ['pl-1ad', '1st Polish Armoured Division', 'PL', 'uk_arm', ['10th Polish Armoured Bde', '3rd Polish Rifle Bde'], [['1944-07', 'Maj. Gen. S. Maczek']], '1944-07-31', 'verify', ['ellis-1', 'general'], 'Ellis: recently arrived by 7 Aug (Totalize); date to verify'],
];
const BRIGADES = [   // independent armoured and tank brigades, ellis-1 Appendix IV
  ['4th Armoured Brigade', 'UK'], ['8th Armoured Brigade', 'UK'], ['27th Armoured Brigade (to 29.7.44)', 'UK'], ['33rd Armoured Brigade', 'UK'], ['6th Guards Tank Brigade', 'UK'],
  ['31st Tank Brigade', 'UK'], ['34th Tank Brigade', 'UK'], ['2nd Canadian Armoured Brigade', 'CA'], ['79th Armoured Division (specialised armour, GHQ troops)', 'UK'], ['1st Special Service Brigade', 'UK'], ['4th Special Service Brigade', 'UK'], ['56th Infantry Brigade (to 49th Div 20.8.44)', 'UK'],
];
const COMMANDS = [
  ['21ag', 'Twenty-First Army Group', 'army group', null, [['1944-01', 'Gen. Sir Bernard L. Montgomery']], 'sourced', ['ellis-1']],
  ['uk-2a', 'Second Army', 'army', '21ag', [['1944-01', 'Lt. Gen. Sir Miles C. Dempsey']], 'sourced', ['ellis-1']],
  ['ca-1a', 'First Canadian Army', 'army', '21ag', [['1944-07-23', 'Lt. Gen. H. D. G. Crerar']], 'verify', ['ellis-1', 'general'], 'Ellis: Crerar arrived in Normandy on 18 Jun with a small headquarters; operational date to verify in Stacey'],
  ['uk-i', 'I Corps', 'corps', 'uk-2a', [['1944-06', 'Lt. Gen. J. T. Crocker']], 'sourced', ['ellis-1']],
  ['uk-viii', 'VIII Corps', 'corps', 'uk-2a', [['1944-06', 'Lt. Gen. Sir Richard N. O\'Connor']], 'sourced', ['ellis-1']],
  ['uk-xii', 'XII Corps', 'corps', 'uk-2a', [['1944-06', 'Lt. Gen. N. M. Ritchie']], 'sourced', ['ellis-1']],
  ['uk-xxx', 'XXX Corps', 'corps', 'uk-2a', [['1944-06', 'Lt. Gen. G. C. Bucknall'], ['1944-08-04', 'Lt. Gen. B. G. Horrocks']], 'sourced', ['ellis-1']],
  ['ca-ii', 'II Canadian Corps', 'corps', 'uk-2a', [['1944-07', 'Lt. Gen. G. G. Simonds']], 'sourced', ['ellis-1']],
  ['us-fusa', 'First United States Army', 'army', null, [['1944-06', 'Lt. Gen. Omar N. Bradley'], ['1944-08-01', 'Lt. Gen. Courtney H. Hodges']], 'sourced', ['blumenson'], 'Blumenson: at noon on 1 Aug the 12th Army Group became operational and Hodges assumed command of First Army'],
  ['us-tusa', 'Third United States Army', 'army', 'us-12ag', [['1944-08-01', 'Lt. Gen. George S. Patton Jr.']], 'sourced', ['blumenson'], 'Blumenson: Patton\'s Third Army came to life on 1 Aug, with the 12th Army Group'],
  ['us-12ag', 'Twelfth Army Group', 'army group', null, [['1944-08-01', 'Lt. Gen. Omar N. Bradley']], 'sourced', ['blumenson'], 'Operational at noon, 1 Aug 1944'],
  ['us-v', 'V Corps', 'corps', 'us-fusa', [['1944-06', 'Maj. Gen. Leonard T. Gerow']], 'sourced', ['blumenson']],
  ['us-vii', 'VII Corps', 'corps', 'us-fusa', [['1944-06', 'Maj. Gen. J. Lawton Collins']], 'sourced', ['blumenson']],
  ['us-viii', 'VIII Corps', 'corps', 'us-fusa', [['1944-06', 'Maj. Gen. Troy H. Middleton']], 'sourced', ['blumenson'], 'Under Third Army from 1 Aug 1944 (verify)'],
  ['us-xix', 'XIX Corps', 'corps', 'us-fusa', [['1944-06', 'Maj. Gen. Charles H. Corlett']], 'sourced', ['blumenson']],
  ['us-xv', 'XV Corps', 'corps', 'us-tusa', [['1944-08', 'Maj. Gen. Wade H. Haislip']], 'sourced', ['blumenson'], 'Scheduled to enter the line between VII and VIII Corps when Third Army became operational'],
  ['us-xii', 'XII Corps', 'corps', 'us-tusa', [['1943', 'Maj. Gen. Gilbert R. Cook'], ['1944-08-19', 'Maj. Gen. Manton S. Eddy']], 'sourced', ['blumenson'], 'Cook commanded since 1943 and set up his headquarters at le Mans on 13 Aug; Eddy took his place before 20 Aug (exact date verify)'],
  ['us-xx', 'XX Corps', 'corps', 'us-tusa', [['1944-08', 'Maj. Gen. Walton H. Walker']], 'sourced', ['blumenson']],
];
// ---------- Germany: corps and divisions met 6 Jun-31 Aug 1944, ellis-1 Appendix V Part II. Positions and arrival dates are the next pass.
const GE_CORPS = ['I SS Panzer', 'II SS Panzer', 'XLVII Panzer', 'LVIII Panzer', 'II Parachute', 'XXV', 'LXVII', 'LXXIV', 'LXXX', 'LXXXI', 'LXXXII', 'LXXXIV', 'LXXXVI'];
const GE_DIV = [
  ['1st SS Panzer', 'ge_pz'], ['2nd Panzer', 'ge_pz'], ['2nd SS Panzer', 'ge_pz'], ['9th Panzer', 'ge_pz'], ['9th SS Panzer', 'ge_pz'], ['10th SS Panzer', 'ge_pz'], ['12th SS Panzer', 'ge_pz'], ['21st Panzer', 'ge_pz'], ['116th Panzer', 'ge_pz'], ['Panzer Lehr', 'ge_pz'],
  ['3rd Panzer Grenadier', 'ge_pz', 'battle group only'], ['15th Panzer Grenadier', 'ge_pz', 'battle group only'], ['17th SS Panzer Grenadier', 'ge_pz'],
  ['2nd Parachute', 'ge_fj'], ['3rd Parachute', 'ge_fj'], ['5th Parachute', 'ge_fj'], ['6th Parachute', 'ge_fj', 'battle group only'],
  ['16th Luftwaffe Field', 'ge_inf'], ['17th Luftwaffe Field', 'ge_inf'], ['18th Luftwaffe Field', 'ge_inf'],
  ['47th', 'ge_inf'], ['48th', 'ge_inf'], ['49th', 'ge_inf'], ['77th', 'ge_inf'], ['84th', 'ge_inf'], ['85th', 'ge_inf'], ['89th', 'ge_inf'], ['91st Airlanding', 'ge_inf'],
  ['226th', 'ge_inf'], ['243rd', 'ge_inf'], ['245th', 'ge_inf'], ['265th', 'ge_inf'], ['266th', 'ge_inf'], ['271st', 'ge_inf'], ['272nd', 'ge_inf'], ['275th', 'ge_inf'], ['276th', 'ge_inf'], ['277th', 'ge_inf'],
  ['326th', 'ge_inf'], ['331st', 'ge_inf'], ['343rd', 'ge_inf'], ['344th', 'ge_inf'], ['346th', 'ge_inf'], ['348th', 'ge_inf'], ['352nd', 'ge_inf'], ['353rd', 'ge_inf'], ['363rd', 'ge_inf'],
  ['708th', 'ge_inf'], ['709th', 'ge_inf'], ['711th', 'ge_inf'], ['716th', 'ge_inf'],
];
const row = r => ({ id: r[0], name: r[1], nat: r[2], tpl: r[3], regs: r[4], commanders: r[5].map(([from, name]) => ({ from, name })), arrive: r[6], status: r[7], src: r[8], note: r[9] || '' });
const allied = {
  title: 'Allied order of battle, Normandy and northern France, 6 June to 31 August 1944', author: 'Tov Binyamin Brog', sources: SOURCES,
  commands: COMMANDS.map(c => ({ id: c[0], name: c[1], type: c[2], parent: c[3], commanders: c[4].map(([from, name]) => ({ from, name })), status: c[5], src: c[6], note: c[7] || '' })),
  divisions: US.concat(CW).map(row),
  brigades: BRIGADES.map(([name, nat]) => ({ name, nat, status: 'sourced', src: ['ellis-1'] })),
  notes: ['Arrival is the date the division began landing on the Continent (US: "Arrived Continent" in eto-oob). Corps attachments by date are the next pass, from the eto-oob Assignment tables and Ellis.',
          'Commander dates written as a year or year-month mark entries whose exact date still has to be read from the source.'],
};
const german = {
  title: 'German formations met by the Allies in northern France, 6 June to 31 August 1944', author: 'Tov Binyamin Brog', sources: SOURCES.filter(s => s.id !== 'eto-oob'),
  armies: [{ name: 'Seventh Army', cmd: 'Dollmann' }, { name: 'Fifteenth Army', cmd: 'von Salmuth' }, { name: 'Panzer Group West (later Fifth Panzer Army)', cmd: 'Geyr von Schweppenburg' }, { name: 'First Army', cmd: 'von der Chevallerie' }].map(a => Object.assign(a, { status: 'sourced', src: ['ellis-1'], note: 'Commanders at midnight 5/6 June 1944' })),
  higher: [{ name: 'OB West', cmd: 'von Rundstedt' }, { name: 'Army Group B', cmd: 'Rommel' }, { name: 'Army Group G', cmd: 'Blaskowitz' }].map(a => Object.assign(a, { status: 'sourced', src: ['ellis-1'] })),
  corps: GE_CORPS.map(n => ({ name: n + ' Corps', status: 'sourced', src: ['ellis-1'] })),
  divisions: GE_DIV.map(([n, tpl, note]) => ({ id: 'ge-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: n + ' Division', tpl, status: (n === '89th' || n === '709th') ? 'inference' : 'sourced', src: ['ellis-1'], note: note || '', position0606: null, arrive: null })),
  notes: ['Ellis lists 51 divisions; this file has the 51 names from Appendix V Part II. OCR read "8oth" as 89th and "7ooth" as 709th, the only divisions with those shapes in the 1944 West.',
          'Next pass: 6 June positions from Harrison, Cross-Channel Attack, and arrival dates from Ellis and Blumenson; templates for static and Luftwaffe field divisions.'],
};
const out = path.join(__dirname, '..', '..', 'data', 'oob');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'allied-1944.json'), JSON.stringify(allied, null, 1));
if (process.argv.includes('--german') || !fs.existsSync(path.join(out, 'german-1944.json'))) fs.writeFileSync(path.join(out, 'german-1944.json'), JSON.stringify(german, null, 1));   // German positions are edited in the file itself after the first build
console.log('allied divisions', allied.divisions.length, 'commands', allied.commands.length, '| german divisions', german.divisions.length, 'corps', german.corps.length);

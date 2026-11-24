// Step 5 vertical slice: Operation Overlord, 6 June to 1 September 1944, built from the step 4 data.
// Map: Brest to Paris, the Channel coast to the Loire (slice game km). Forces: data/oob (arrival dates, positions, entry
// points, commanders, corps attachments), data/air (airfields open on the start date, troop carrier fleets).
// Every placement rule that goes beyond the sources is marked "inference" below and in docs/step5-progress.md.
// node tools/scenario-overlord.js [cs] [hours]       AI against AI, headless
const E = require('./load-engine')(), { createSim, SCENARIOS, divForm } = E;
const realMap = require('./realmap');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'data');
const WIN = { x0: 30, y0: 110, w: 600, h: 330 };
const START = '1944-06-06T00:00', END = '1944-09-01T00:00';
const hrs = (date, hh) => (Date.parse(date + 'T' + String(hh == null ? 12 : hh).padStart(2, '0') + ':00Z') - Date.parse(START + 'Z')) / 3.6e6;
const W = (x, y) => [+(x - WIN.x0).toFixed(2), +(y - WIN.y0).toFixed(2)];   // slice km -> window km
const clampIn = p => [Math.min(WIN.w - 1.5, Math.max(1.5, p[0])), Math.min(WIN.h - 1.5, Math.max(1.5, p[1]))];

// beaches, drop zones and objectives in slice km, converted from latitude and longitude with pyproj (EPSG:4326 -> 2154)
const P = { utah: [297.0, 177.9], omahaW: [316.4, 183.7], omahaE: [321.6, 185.7], gold: [341.3, 188.6], juno: [350.7, 189.4], sword: [360.7, 194.2],
  dz82: [286.7, 178.6], dz101: [292.5, 182.3], dz6: [362.6, 201.7], mulberryB: [337.0, 187.8] };
// the six assault divisions and three airborne divisions of 6 June (H-Hour 0630 on the US beaches, 0725 on Gold and Sword, 0735
// and 0745 on Juno: Ellis I and Harrison p. 300; airborne times from Craven and Cate p. 143 and Ellis). First-day objective lines are Claude's reading of
// the D-Day objectives in Harrison and Ellis (inference).
const ASSAULT = {
  'us-4id': { mode: 'sea', t: 6.5, at: 'utah', obj: [[289, 186], [295, 186]] },
  'us-1id': { mode: 'sea', t: 6.5, at: 'omahaE', obj: [[322, 196], [330, 196]] },
  'us-29id': { mode: 'sea', t: 7, at: 'omahaW', obj: [[310, 195], [318, 195]] },
  'uk-50id': { mode: 'sea', t: 7.42, at: 'gold', obj: [[334, 199], [343, 199]] },
  'ca-3id': { mode: 'sea', t: 7.75, at: 'juno', obj: [[346, 204], [353, 204]] },
  'uk-3id': { mode: 'sea', t: 7.42, at: 'sword', obj: [[352, 205], [358, 205]] },
  'us-101ab': { mode: 'air', t: 2, at: 'dz101', night: 1 },
  'us-82ab': { mode: 'air', t: 1.4, at: 'dz82', night: 1 },
  'uk-6ab': { mode: 'air', t: .8, at: 'dz6', night: 1 } };
// where each German division went when committed: the place its sourced arrival note names (data/oob/german-1944.json);
// the point chosen for that place is Claude's (inference). Divisions without an entry keep to the staff AI near where they stand.
const Q = {caumont: [322.5, 215.5], odon: [347.5, 212.2], stsylvain: [365.5, 220.8], tilly: [336.1, 207.3], carentanSW: [289.4, 192.7], cerisy: [314.3, 204.0], periers: [290.3, 202.7], elbeuf: [455.2, 198.1], chartres: [488.3, 292.3], montebourg: [282.7, 168.9], sourdeval: [311.7, 256.2], cauS: [354.7, 215.9], stloW: [301.3, 202.2], vireW: [299.5, 207.7], rouenS: [458.2, 193.8], orneE: [365.5, 200.7], hayedupuits: [269.8, 190.5], brecey: [302.6, 246.8], lemans: [391.2, 339.7], brest: [46.3, 273.8], caenN: [354.5, 202.5], carpiquet: [348.5, 206.7], stloS: [301.2, 217.8], elle: [304, 204.5]};
const GDEST = { 'ge-1st-ss-panzer': 'cauS', 'ge-2nd-panzer': 'caumont', 'ge-2nd-ss-panzer': 'stloS', 'ge-9th-panzer': 'lemans', 'ge-9th-ss-panzer': 'odon', 'ge-10th-ss-panzer': 'odon',
  'ge-12th-ss-panzer': 'carpiquet', 'ge-21st-panzer': 'caenN', 'ge-116th-panzer': 'stsylvain', 'ge-panzer-lehr': 'tilly', 'ge-17th-ss-panzer-grenadier': 'carentanSW', 'ge-2nd-parachute': 'brest',
  'ge-3rd-parachute': 'cerisy', 'ge-5th-parachute': 'periers', 'ge-16th-luftwaffe-field': 'caenN', 'ge-17th-luftwaffe-field': 'elbeuf', 'ge-48th': 'chartres', 'ge-77th': 'montebourg',
  'ge-84th': 'sourdeval', 'ge-85th': 'cauS', 'ge-89th': 'cauS', 'ge-265th': 'stloW', 'ge-266th': 'vireW', 'ge-271st': 'odon', 'ge-272nd': 'cauS', 'ge-275th': 'periers', 'ge-276th': 'tilly',
  'ge-277th': 'odon', 'ge-326th': 'caumont', 'ge-331st': 'rouenS', 'ge-346th': 'orneE', 'ge-353rd': 'hayedupuits', 'ge-363rd': 'brecey', 'ge-708th': 'lemans' };
// dated fallbacks of divisions that began on the coast (inference): the 352nd, broken behind Omaha, fell back to the Elle
// north of St-Lo: at about 1900 on 9 June Kraiss was ordered to a line on the Elle from Berigny to Airel, to be reached by 0600 on 10 June
// (Harrison, Cross-Channel Attack, V Corps chapter, 7-18 June; page to be read from the printed book)
const GFALL = { 'ge-352nd': { at: 'elle', date: '1944-06-09', h: 22 } };
// sector names for the theater commander's reports
const QN = { caumont: 'Caumont', odon: 'Odon', stsylvain: 'Saint-Sylvain', tilly: 'Tilly', carentanSW: 'Carentan', cerisy: 'Cerisy', periers: 'Périers', elbeuf: 'Elbeuf', chartres: 'Chartres', montebourg: 'Montebourg', sourdeval: 'Sourdeval',
  cauS: 'Bourguébus', stloW: 'Saint-Lô west', vireW: 'Vire river', rouenS: 'Rouen', orneE: 'Orne bridgehead', hayedupuits: 'La Haye-du-Puits', brecey: 'Brécey', lemans: 'Le Mans', brest: 'Brest', caenN: 'Caen', carpiquet: 'Carpiquet', stloS: 'Saint-Lô south', elle: 'Elle' };
// the way each sector falls back (inference): toward Le Mans by default; the Cotentin sectors toward Cherbourg, the Orne and Seine sectors eastward
const QB = { montebourg: [-.59, -.81], orneE: [.95, .3], elbeuf: [.7, .7], rouenS: [.7, .7], brest: [-1, 0] };
function theaterOf(plan) { const sectors = {}, bc = BEACHES.reduce((a, p) => [a[0] + p[0] / BEACHES.length, a[1] + p[1] / BEACHES.length], [0, 0]), rx = 391 - bc[0], ry = 342 - bc[1], rl = Math.hypot(rx, ry);
  for (const k in Q) { const q = Q[k]; sectors[k] = { n: QN[k] || k, p: W(q[0], q[1]), line: sector(q).map(p => W(p[0], p[1])), back: QB[k] || [rx / rl, ry / rl] }; }
  // base: the middle of the invasion beaches; rear: Le Mans, Seventh Army's headquarters; back: the Seine from Elbeuf to Mantes. okwDelayH is the theater module's 16 days:
  // Avranches fell on 30-31 July and the general withdrawal was ordered on 16 August (Blumenson p. 527)
  return { s: 1, n: 'OB West', sectors, plan, base: W(bc[0], bc[1]), rear: W(391, 342), back: [W(454, 200), W(489, 221), W(504, 232)], backN: 'the Seine' }; }
// the sourced date is when a division reached the front, so it sets out earlier by an estimated march: panzer divisions about
// 150 km a day moving by night, others about 35 km a day, plus 6 hours to form up (inference; the engine then runs the actual move)
const marchH = (tpl, a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) / (tpl === 'ge_pz' ? 150 : 35) * 24 + 6;
// Hitler's standing order to hold fast kept the divisions on the Normandy front where they stood; the Germans began their withdrawal
// across the length of the American front on 16 August (Blumenson p. 527). Divisions sent to a sector hold it until then.
const HOLD_UNTIL = '1944-08-16';
// AI phase lines (game setting, calibrated to the historical front; inference). Until Cobra the AI army groups fight the lodgment
// battle north of Lessay - St-Lo - Caumont - south of Caen; until 1 August they go no farther than Avranches in the west and the
// Caen plain in the east. A player's own formations are not bound by them.
const PHASES = [{ until: '1944-07-03', line: [[200, 206], [270, 206], [290, 200], [300, 207.5], [308, 208], [322.5, 218], [340, 210], [347, 203.5], [368, 203], [374, 105], [640, 105]] },   // to 3 July: north of St-Lo and of Caen (First Army's offensive toward St-Lo opened on 3 July)
  { until: '1944-07-08', line: [[200, 206], [270, 206], [290, 207], [301.5, 214], [322.5, 218], [340, 210], [347, 203.5], [368, 203], [374, 105], [640, 105]] },   // to 8 July: Caen still closed (Charnwood opened on 8 July)
  { until: '1944-06-19', north: 1, line: [[200, 105], [255, 105], [258, 170], [300, 170], [303, 105], [640, 105]] },   // the northern Cotentin: closed until the peninsula was cut and VII Corps turned north on 19 June
  { until: '1944-08-08', line: [[200, 440], [338, 440], [342, 224], [385, 224], [390, 440], [640, 440]] },   // the Falaise road: closed until Totalize opened on 8 August
  { until: '1944-08-25', north: 1, line: [[0, 440], [80, 440], [84, 105], [640, 105]] },   // Brest: VIII Corps opened its attack on the fortress on 25 August
  { until: '1944-07-25', line: [[200, 206], [270, 206], [290, 207], [301.5, 214], [322.5, 218], [355, 219], [368, 211], [374, 105], [640, 105]] },
  { until: '1944-08-01', line: [[200, 292], [330, 292], [338, 236], [355, 226], [372, 226], [380, 105], [640, 105]] },
  { until: '1944-08-19', north: 1, line: [[200, 105], [373, 105], [376, 222], [640, 222]] },   // the lower Seine and the coast east of the Dives: closed until the Seine was reached at Mantes on 19-20 August (general history, verify). The German Fifteenth Army there is outside the slice
  { until: '1944-08-22', line: [[200, 440], [526, 440], [530, 105], [640, 105]] }];   // Paris and the ground east of it: closed until the advance on the city was ordered on 22 August (Blumenson ch. XXIX, verify the page)   // east of the Dives the coast stays shut: Le Havre and the Seine ports fell in September
// fighting quality (game setting, inference): veteran and green divisions by their 1944 record in general history
const XP = { 'us-1id': 1.05, 'us-9id': 1.05, 'us-82ab': 1.1, 'us-101ab': 1.05, 'us-2ad': 1.05, 'uk-7ad': 1, 'uk-50id': 1, 'uk-51id': 1, 'uk-6ab': 1.05,
  'ge-1st-ss-panzer': 1.15, 'ge-2nd-ss-panzer': 1.1, 'ge-9th-ss-panzer': 1.1, 'ge-10th-ss-panzer': 1.1, 'ge-12th-ss-panzer': 1.15, 'ge-panzer-lehr': 1.15, 'ge-2nd-panzer': 1.1,
  'ge-21st-panzer': 1, 'ge-116th-panzer': 1.05, 'ge-17th-ss-panzer-grenadier': 1, 'ge-2nd-parachute': 1.1, 'ge-3rd-parachute': 1.1, 'ge-5th-parachute': .95, 'ge-352nd': 1 };
const xpOf = d => XP[d.id] || (/^ge-.*luftwaffe/.test(d.id) ? .75 : /^ge-(7\d\d|709|711|716|243|265|266|343)/.test(d.id) ? .85 : /^ge-/.test(d.id) ? .95 : .9);
// a German sector line: 14 km, facing the nearest beach, dug in on arrival as in the hedgerows, so neighbouring sectors close up into a front (inference)
const BEACHES = [[297.0, 177.9], [318.0, 184.7], [341.3, 188.6], [350.7, 189.4], [360.7, 194.2]];
function sector(q) { let b = BEACHES[0], bd = 1e9; for (const p of BEACHES) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; b = p; } }
  const ax = (b[0] - q[0]) / (bd || 1), ay = (b[1] - q[1]) / (bd || 1), px = -ay * 7, py = ax * 7; return [[q[0] - px, q[1] - py], [q[0] + px, q[1] + py]]; }
// four Brittany divisions formed mobile Kampfgruppen of reinforced regiments, which is what went to Normandy (Harrison p. 254)
const KG = /^ge-(265th|266th|275th|353rd)$/;
function kampfgruppe(f) { const keep = [], regs = []; const take = (R, n) => { const idx = []; for (const i of R.idx.slice(0, n)) { idx.push(keep.length); keep.push(f.sub[i]); } if (idx.length) regs.push({ n: R.n, role: R.role, idx }); };
  const man = f.regs.filter(R => R.role === 'man'), art = f.regs.find(R => R.role === 'arty'), tr = f.regs.find(R => R.role === 'troops');
  if (man[0]) take(man[0], 9); if (man[1]) take(man[1], 1); if (art) take(art, 1); if (tr) regs.push({ n: tr.n, role: tr.role, idx: tr.idx.filter(i => /Pionier/.test(f.sub[i])).map(i => { keep.push(f.sub[i]); return keep.length - 1; }) });
  f.sub = keep; f.regs = regs.filter(R => R.idx.length); f.n = f.n + ' (Kampfgruppe)'; return f; }
// an independent regiment in the order of battle: one infantry regiment of the template, under its own number
const REGT = { 'ge-fjr6': '6' };
function regiment(f) { const R = f.regs.find(R => R.role === 'man'); f.sub = R.idx.map(i => f.sub[i]); f.regs = [{ n: R.n, role: R.role, idx: f.sub.map((x, i) => i) }]; return f; }
const GSTAY = /^ge-(2nd-parachute|343rd)$/;   // the Brest garrison stays in the fortress (Blumenson; arrival notes)
// follow-up divisions land over the beach of the corps they joined (inference: the sources give the date, not the beach)
const US_UTAH = /^(VII|VIII|XV|XX|XII)$/;
const beachFor = (nat, corps) => nat === 'US' || nat === 'FR' ? (US_UTAH.test(corps || '') ? 'utah' : 'omahaE') : /Canadian/.test(corps || '') ? 'juno' : /^I$/.test(corps || '') ? 'sword' : 'gold';

function makeOverlord(cs) {
  const base = SCENARIOS.find(s => s.id === 'falaise');
  const m = realMap(Object.assign({ cs }, WIN));
  // town names: realmap.js applies the 1944 names in data/network/town-names-1944.json
  const J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const A = J('oob/allied-1944.json'), G = J('oob/german-1944.json'), T = J('oob/attachments-1944.json');
  const corpsOf = (id, date) => { const r = T.rows.filter(q => q.div === id && q.from <= date).sort((a, b) => a.from < b.from ? -1 : 1); return r.length ? r[r.length - 1].corps : (T.rows.find(q => q.div === id) || {}).corps; };
  const cmdAt = (d, date) => { const c = (d.commanders || []).filter(q => q.from <= date); return (c.length ? c[c.length - 1] : (d.commanders || [])[0] || { name: 'Commander' }).name; };
  const forms = [], log = [];

  // ---- Allied divisions: every division whose arrival date falls before 1 September
  for (const d of A.divisions) {
    if (!d.arrive || d.arrive >= END.slice(0, 10)) continue;
    const a = ASSAULT[d.id], corps = corpsOf(d.id, d.arrive), nat = d.nat || 'US';
    const at = a ? P[a.at] : P[beachFor(nat, corps)];
    const land = W(at[0], at[1] + (a && a.mode === 'air' ? 0 : 2.5));       // a sea landing forms up 2.5 km inland of the waterline
    const t = a ? a.t : hrs(d.arrive, 12);
    const third = T.rows.some(q => q.div === d.id && q.army === 'Third'), f = divForm({ tpl: d.tpl, s: 0, n: d.name, cmd: cmdAt(d, d.arrive), ag: third ? .75 : nat === 'US' ? .55 : .45, sk: .6, xp: xpOf(d), regs: (d.regs || []).slice(0, 3), x: land[0], y: land[1] });
    if (nat === 'FR') f.nat = 'US';                      // 2e DB fought on US equipment and organisation
    f.arr = a && a.mode === 'air' ? { t, mode: 'air', from: W(at[0] + 60, 60), night: a.night } : { t, mode: 'sea', from: W(at[0], at[1] - 18) };
    if (a && a.obj) f.ai = [{ t: t + 1, path: [], line: a.obj.map(p => W(p[0], p[1])) }];
    f.corps = corps || null; forms.push(f); log.push([d.id, 'Allied', a ? a.mode + ' assault' : 'sea, ' + (corps || '?') + ' Corps', t.toFixed(1)]);
  }

  // ---- German divisions. Rules (inference, Claude's): a division with a 6 June position starts there and is free to move
  // from its sourced arrival date; static infantry already on the coast holds a line at its position, dug in. A division with
  // only an arrival record enters by road at its entry point on that date. Entry points outside the window move to its edge.
  const thPlan = [];   // the German default plan: each division's historical sector and the hour it sets out; the theater commander (engine/src/theater.js) carries it out and departs from it as the battle requires
  for (const d of G.divisions) {
    const p0 = d.position0606 && d.position0606.xy, a = d.arrive || {};
    if (!p0 && !(a.date && a.entry)) { log.push([d.id, 'German', 'not in the slice', '-']); continue; }
    if (a.date && a.date >= END.slice(0, 10)) continue;
    const regs = REGT[d.id] ? [REGT[d.id], REGT[d.id], REGT[d.id]] : ['1', '2', '3'], cmd = d.cmd || 'Kommandeur';
    if (p0) {
      const [x, y] = clampIn(W(p0[0], p0[1])), dest = GDEST[d.id] && Q[GDEST[d.id]], fr = Math.max(0, a.date ? hrs(a.date, 12) - (dest ? marchH(d.tpl, p0, dest) : 0) : 0);
      const f = divForm({ tpl: d.tpl, s: 1, n: d.name, cmd, ag: .5, sk: .65, xp: xpOf(d), regs, x, y }); f.gid = d.id; if (KG.test(d.id)) kampfgruppe(f); if (REGT[d.id]) regiment(f);
      const coast = (d.tpl === 'ge_inf' || REGT[d.id]) && (!a.date || a.date <= '1944-06-06');
      if (coast) { const hw = REGT[d.id] ? 1.2 : 5; f.line = [[x - hw, y], [x + hw, y]]; f.dug = 1; f.free = 0; }   // a regiment holds its town; a division holds ten kilometres else f.free = fr;
      if (GDEST[d.id]) { thPlan.push({ f: d.name, sec: GDEST[d.id], t: Math.max(.5, fr) }); f.stay = 1; f.stayUntil = hrs(HOLD_UNTIL, 0); f.stayMinStr = .45; }
      if (coast) { f.stay = 1; f.stayUntil = hrs(HOLD_UNTIL, 0); f.stayMinStr = .45; }
      if (GFALL[d.id]) { const q = GFALL[d.id]; thPlan.push({ f: d.name, sec: q.at, t: hrs(q.date, q.h) }); }
      if (GSTAY.test(d.id)) f.stay = 1;
      forms.push(f); log.push([d.id, 'German', coast ? 'holds at 6 June position' : 'at 6 June position, free from', coast ? '0' : fr.toFixed(0)]);
    } else {
      const [x, y] = clampIn(W(a.entry.xy[0], a.entry.xy[1])), dest = GDEST[d.id] && Q[GDEST[d.id]], t = Math.max(1, hrs(a.date, 12) - (dest ? marchH(d.tpl, a.entry.xy, dest) : 0));
      const f = divForm({ tpl: d.tpl, s: 1, n: d.name, cmd, ag: .5, sk: .65, xp: xpOf(d), regs, x, y }); f.gid = d.id; f.arr = { t, mode: 'road' };
      if (GDEST[d.id]) { thPlan.push({ f: d.name, sec: GDEST[d.id], t: t + 1 }); f.stay = 1; f.stayUntil = hrs(HOLD_UNTIL, 0); f.stayMinStr = .45; }
      forms.push(f); log.push([d.id, 'German', 'road entry', t.toFixed(0)]);
    }
  }

  // ---- Operation Luettich, the Mortain counterattack: on the night of 6/7 August four panzer divisions attacked west toward Avranches
  // to cut off Third Army (Blumenson ch. XXV, general history to verify). In the game it goes in only if the Allies hold Avranches by then.
  const LUETTICH = ['ge-2nd-panzer', 'ge-2nd-ss-panzer', 'ge-116th-panzer', 'ge-1st-ss-panzer'], av = W(319.3, 287.8);
  for (const f of forms) if (f.s === 1 && LUETTICH.includes(f.gid)) (f.ai = f.ai || []).push({ t: hrs('1944-08-06', 22), path: [], line: [[av[0] + 4, av[1] - 6], [av[0] + 4, av[1] + 6]], cond: { vp: 'Avranches', own: 0 } });
  // ---- objectives: towns of 10,000 or more in the 1936 census, weighted by size, plus the named objectives of the plan
  const named = { 'Carentan': 10, 'Cherbourg': 30, 'Caen': 30, 'Saint-Lô': 20, 'Brest': 25, 'Paris': 40, 'Avranches': 15, 'Bayeux': 15, 'Carentan': 10, 'Falaise': 15, 'Le Mans': 15, 'Rennes': 15, 'Rouen': 15 };
  // largest first; a town within 10 km of a larger objective counts as its suburb and is left out (inference: keeps Paris one objective)
  const vp = [], cand = m.towns.map(t => [t, named[t[0]] || named[t[0].replace(/-en-Cotentin$/, '')] || (t[3] >= 3 ? 20 : t[3] >= 2 ? 10 : 0)]).filter(q => q[1]).sort((a, b) => b[1] - a[1] || b[0][3] - a[0][3]);
  for (const [t, pts] of cand) if (!vp.some(v => Math.hypot(v[1] - t[1], v[2] - t[2]) < (v[3] >= 40 ? 16 : 10))) vp.push([t[0].replace(/-en-Cotentin$/, ''), t[1], t[2], pts, 1]);
  // stepping stones for the staff AI: smaller towns at least 12 km from any other objective, 3 points each (inference)
  for (const t of m.towns) if (t[3] === 1 && !vp.some(v => Math.hypot(v[1] - t[1], v[2] - t[2]) < 12)) vp.push([t[0], t[1], t[2], 3, 1]);
  for (const [n, xy] of [['Avranches', [319.3, 287.8]], ['Carentan', [302.3, 192.6]]]) if (!vp.some(v => v[0].startsWith(n))) { const q = W(xy[0], xy[1]); vp.push([n, q[0], q[1], named[n], 1]); }   // towns under 10,000 the plan named (positions: pyproj, inference)

  // ---- supply: beach dumps open an hour or two after each landing; Mulberry B from 16 June (Ruppenthal p. 406, first vehicles
  // over the pierheads). Stocks and rates are game settings (inference). German depots stand on the routes in from the east and south.
  const src = (n, xy, t, stock, rate) => { const q = W(xy[0], xy[1] + .5); return { n, x: q[0], y: q[1], t, stock, rate }; };   // dumps at the head of the beach
  const alliedSrc = [src('Utah beach dumps', P.utah, 8, 30, 3), src('Omaha beach dumps', P.omahaE, 9, 30, 3), src('Gold beach dumps', P.gold, 9, 30, 3),
    src('Juno beach dumps', P.juno, 9, 30, 3), src('Sword beach dumps', P.sword, 9, 30, 3), src('Mulberry B', P.mulberryB, hrs('1944-06-16', 8), 40, 4)];
  const gSrc = [['Paris depots (OB West)', [545, 250]], ['Rouen', [432, 172]], ['Alencon', [415, 290]], ['Le Mans', [410, 345]], ['Rennes', [270, 330]], ['Brest', [50, 272]]]
    .map(([n, xy]) => { const q = clampIn(W(xy[0], xy[1])); return { n, x: q[0], y: q[1], stock: 60, rate: 2 }; });
  // Cherbourg opens after it is held and cleared: first discharge about 16 July after capture on 26-27 June (general history,
  // verify against Ruppenthal ch. XI); 456 hours of clearing.
  const cb = vp.find(v => v[0] === 'Cherbourg');
  const ports = cb ? [{ vp: 'Cherbourg', s: 0, n: 'Cherbourg port', x: cb[1], y: cb[2], rate: 5, stock: 50, clear: 456 }] : [];

  // ---- Allied non-divisional support. AGRAs: one heavy and three medium regiments each, one per corps plus one spare (Ellis I p. 537);
  // which AGRAs and brigades, and their dates, are general history (verify). US corps artillery: four 155mm battalions per corps, a
  // conservative reading of the corps field artillery groups (inference). All land over their beach and wait in the Support tab.
  const sup = [], add = (k, n, at, date, h) => { const q = W(P[at][0], P[at][1] + 3); sup.push({ k, n, x: q[0] + (sup.length % 3) * .8, y: q[1] + (sup.length % 2) * .8, t: date ? hrs(date, 12) : h }); };
  for (const [n, at, date] of [['3rd AGRA', 'gold', '1944-06-14'], ['4th AGRA', 'juno', '1944-06-20'], ['8th AGRA', 'gold', '1944-06-24'], ['2nd Canadian AGRA', 'juno', '1944-07-07']])
    for (let i = 0; i < 4; i++) add('uk_med55', (i ? 'Medium Regt RA ' : 'Heavy Regt RA ') + '(' + n + ')', at, date);
  for (const [n, at, date, h] of [['8th Armoured Bde', 'gold', null, 10], ['27th Armoured Bde', 'sword', null, 10], ['2nd Canadian Armoured Bde', 'juno', null, 10], ['4th Armoured Bde', 'gold', '1944-06-08'],
    ['33rd Armoured Bde', 'juno', '1944-06-13'], ['31st Tank Bde', 'gold', '1944-06-20'], ['34th Tank Bde', 'gold', '1944-07-01'], ['6th Guards Tank Bde', 'gold', '1944-07-20']])
    for (let i = 0; i < 3; i++) add('uk_tk_sher', 'Armoured Regt (' + n + ')', at, date, h);
  for (const [n, at, date] of [['V Corps Artillery', 'omahaE', '1944-06-08'], ['VII Corps Artillery', 'utah', '1944-06-08'], ['XIX Corps Artillery', 'omahaE', '1944-06-14'], ['VIII Corps Artillery', 'utah', '1944-06-15'],
    ['XV Corps Artillery', 'utah', '1944-08-01'], ['XX Corps Artillery', 'utah', '1944-08-01'], ['XII Corps Artillery', 'utah', '1944-08-05']])
    for (let i = 0; i < 4; i++) add('us_fa155', '155mm FA Bn (' + n + ')', at, date);
  // ---- naval gunfire support for the assault (ships by beach from general history; verify)
  const ship = (k, n, xy) => { const q = W(xy[0], xy[1] - 9); return { k, n, x: q[0], y: q[1], t: 0 }; };
  const pool = [ship('nav15', 'USS Nevada (Force U)', P.utah), ship('nav15', 'USS Texas and Arkansas (Force O)', P.omahaW), ship('nav6', 'HMS Ajax and Argonaut (Force G)', P.gold),
    ship('nav6', 'HMS Belfast and Diadem (Force J)', P.juno), ship('nav15', 'HMS Warspite and Ramillies (Force S)', P.sword)];

  // corps: the commands in allied-1944.json, and each division's corps by date from attachments-1944.json (US rows from the Theater
  // Historian's tables, British and Canadian from Ellis's snapshots). Army and army group echelons come later.
  const ROM = c => (c || '').replace(/ Canadian$/, '').trim().toLowerCase();
  const corpsKey = (nat, row) => { if (!row.corps) return null; if (/Canadian/.test(row.corps)) return 'ca-ii'; return ((nat === 'US' || nat === 'FR') ? 'us-' : 'uk-') + ROM(row.corps); };
  const commands = A.commands.filter(c => c.type === 'corps' || c.type === 'army').map(c => ({ id: c.id, s: 0, level: c.type, n: c.type === 'army' ? c.name : (c.id.startsWith('us-') ? 'US ' : c.id.startsWith('uk-') ? 'British ' : '') + c.name,
    cmd: { n: cmdAt(c, START.slice(0, 10)), ag: /Patton/.test(cmdAt(c, '1944-08-01')) ? .85 : c.id.startsWith('us-') || c.id.startsWith('us') ? .6 : .45, sk: .65 } }));   // commanders' aggression: game settings
  const known = new Set(commands.map(c => c.id)), cmdPlan = [];
  for (const d of A.divisions) { if (!d.arrive || d.arrive >= END.slice(0, 10)) continue; const nat = d.nat || 'US';
    for (const r of T.rows.filter(q => q.div === d.id).sort((a, b) => a.from < b.from ? -1 : 1)) { const k = corpsKey(nat, r); if (k && known.has(k)) cmdPlan.push({ t: Math.max(0, hrs(r.from, 0)), f: d.name, c: k }); } }
  // corps to armies, by the first date each corps appears under each army in the attachment rows
  const ARMY = { First: 'us-fusa', Third: 'us-tusa', Second: 'uk-2a', 'First Canadian': 'ca-1a' }, seen = {};
  for (const r of T.rows.slice().sort((a, b) => a.from < b.from ? -1 : 1)) { const a = ARMY[r.army]; if (!a || !r.corps) continue; const us = a.startsWith('us-');
    const k = /Canadian/.test(r.corps) ? 'ca-ii' : (us ? 'us-' : 'uk-') + ROM(r.corps); if (!known.has(k) || seen[k + a]) continue; seen[k + a] = 1; cmdPlan.push({ t: Math.max(0, hrs(r.from, 0)), f: 'cmd:' + k, c: a }); }
  const air = realMap.airAt(START.slice(0, 10), Object.assign({ cs }, WIN));
  // advanced landing grounds and airfields that opened after 6 June, by their dates in data/air (Johnson 1988 for US fields; RAF dates inference)
  const AF = J('air/airfields-1944.json'), fieldPlan = AF.fields.filter(q => q.open && q.open > START.slice(0, 10) && q.open < END.slice(0, 10) && q.xy[0] >= WIN.x0 && q.xy[0] <= WIN.x0 + WIN.w && q.xy[1] >= WIN.y0 && q.xy[1] <= WIN.y0 + WIN.h)
    .map(q => { const p = W(q.xy[0], q.xy[1]); return { s: 0, t: hrs(q.open, 12), n: q.code + ' ' + q.name, x: p[0], y: p[1], hist: q.code }; });
  const off = [{ n: 'Airfields in southern England', x: 300 - WIN.x0, y: 0, kind: 'offmap' }, { n: 'Fields beyond the Seine', x: WIN.w - 12, y: 120, kind: 'offmap' }];
  const gGroups = [['JG 2 and JG 26 (Air Corps II)', 'bf109', 48, 0, 'cap'], ['Fighter reinforcements from Germany', 'fw190', 36, 0, 'cas'], ['KG 54 and KG 66', 'ju88', 24, 1, 'strat']];   // game groups scaled to Ellis's 319 operational aircraft (inference)
  const sides = base.sides.map((sd, s) => Object.assign({}, sd, {
    name: s ? 'OB West: Seventh Army and Panzer Group West' : 'Allied Expeditionary Force: 21st Army Group',
    rear: s ? [0, 1] : [0, -1], pocket: s ? true : undefined, restH: s ? 3 : 10, aiPerVP: s ? 2 : 4, aiRng: s ? 0 : 150,   // Allied staff AI: up to four divisions on one objective, reaching 40 km, so follow-up divisions join the battle instead of waiting at the beach (game setting)
     posture: s ? 'defend' : 'attack', assets: s ? [] : sd.assets || [],
    sources: s ? gSrc : alliedSrc, pool: s ? [] : pool.concat(sup), bases: [off[s]].concat(air.bases[s]), transport: { aircraft: air.transport[s] }, groups: s ? gGroups : sd.groups }));

  // 12-hour weather periods: the storm of 19-22 June from Ruppenthal p. 406; D-Day overcast; the rest drawn with a fixed seed (inference)
  const nP = Math.ceil(hrs(END.slice(0, 10), 0) / 12), weather = []; let r = 7;
  for (let i = 0; i < nP; i++) { r = (r * 16807) % 2147483647; const u = r / 2147483647, day = new Date(Date.parse(START + 'Z') + i * 12 * 3.6e6).toISOString().slice(0, 10);
    weather.push(day >= '1944-06-19' && day <= '1944-06-22' ? 'rain' : day === '1944-06-06' ? 'overcast' : u < .55 ? 'clear' : u < .85 ? 'cloud' : u < .95 ? 'overcast' : 'rain'); }
  const beach = Object.values({ utah: P.utah, omahaW: P.omahaW, omahaE: P.omahaE, gold: P.gold, juno: P.juno, sword: P.sword }).map(b => { const q = W(b[0], b[1]); return [q[0] - 4, q[1] - 3, q[0] + 4, q[1] + 3]; });

  const sc = Object.assign({}, base, m, { id: 'overlord', title: 'Overlord: D-Day to the Seine', sub: 'Normandy and Brittany, 6 June to 1 September 1944', start: START, hours: hrs(END.slice(0, 10), 0),
    ownCell: 1, aiExact: 1, divScale: [22, 70], fieldPlan, commands, cmdPlan, armyAI: { only: ['us-tusa'], from: hrs('1944-08-01', 6), reachKm: 90, cadenceH: 12, waitH: 24, supply: .3, frontKm: 4, pocketBonus: 2 }, detourKm: 14, phaseLines: PHASES.map(q => ({ s: 0, north: q.north, until: hrs(q.until, 6), line: q.line.map(p => W(p[0], p[1])) })), view: { x: 292, y: 86, dist: 95, pitch: 1.35 }, playerSides: [0, -1],   // the player commands the Allies or watches; the German side belongs to the theater commander
    modules: ['transport', 'air', 'command', 'politics', 'theater', 'repl', 'doctrine'],
    doctrine: { devKm: 5 },   // divisions leave the roads within 5 km of known enemy. At the module's 15 km every division in the bridgehead moved across the bocage and Bayeux had not fallen by 10 June in a test game (seed 104); at 5 km it fell as before. Game setting
    ownR: 3, ownMax: 15, isoShrinkKm: 12,   // front-line ground model and shrinking pockets (engine fixes from the Sarn Corridor build; starting values, game settings)
    // replacements, in battalion-equivalents of 800 men a day:
    //  US: the plan moved more than 200,000 replacements to the Continent in the first ninety days (Ruppenthal, Logistical Support of the Armies, vol. I, replacement plan), about 2,200 men or 2.8 battalions a day
    //  German: by mid-July 5,210 replacements had arrived against about 87,000 casualties, 6 percent (Blumenson pp. 181-182), about 130 men a day
    //  The British rate (which also serves Canadian and Polish divisions) and every experience level are game settings (inference). The French division draws on the US pool
    repl: { pools: [{ k: 'us', n: 'US replacement system', s: 0, nat: ['US'], perDay: [{ from: 48, n: 2.8 }], xp: .85 },
      { k: 'cw', n: 'British and Canadian reinforcement groups', s: 0, nat: ['UK'], perDay: [{ from: 48, n: 1.2 }], xp: .9 },
      { k: 'ge', n: 'Replacement Army drafts', s: 1, perDay: [{ from: 0, n: .16 }], xp: .8 }] }, theater: theaterOf(thPlan), politics: { reviews: [hrs('1944-07-25', 6), hrs('1944-08-22', 6)] }, forest: [], rough: [], marsh: [], bridges: [], vp, ports, beach, weather, sides, forms, front: { all: 1 }, thin: undefined, halt: undefined, mines: undefined,
    brief: ['Land the six assault divisions and three airborne divisions, join the beachheads, take Caen and Cherbourg, break out into Brittany and drive to the Seine.',
      'Throw the landings back while the beachhead is shallow. Hold Caen and the bocage, bring up the panzer divisions, and keep the Allies out of the ports.'],
    hist: 'Historically Caen held until 9 July and Cherbourg fell on 26-27 June. Operation Cobra broke out at St-Lo on 25 July, the Falaise pocket closed on 19-21 August, Paris was liberated on 25 August, and the Allies stood on the Seine by the end of the month.' });
  sc.buildLog = log;
  return sc;
}
// historical capture dates for the AI-vs-AI comparison. Sourced from Blumenson, Breakout and Pursuit (pages from the OCR running heads,
// one or two off): Cherbourg p. 37, Avranches p. 316, Rennes p. 355, Nantes p. 367, Orléans p. 566, Paris p. 589, Brest (garrison) p. 651.
// The rest are general history, to verify: Carentan, Caen, St-Lô, Coutances, Le Mans, Falaise, Chartres, Rouen.
const MILESTONES = [['Carentan', '1944-06-12'], ['Cherbourg', '1944-06-26'], ['Caen', '1944-07-09'], ['Saint-Lô', '1944-07-18'], ['Coutances', '1944-07-28'], ['Avranches', '1944-07-30'],
  ['Rennes', '1944-08-04'], ['Le Mans', '1944-08-08'], ['Nantes', '1944-08-12'], ['Orléans', '1944-08-16'], ['Falaise', '1944-08-17'], ['Chartres', '1944-08-18'], ['Paris', '1944-08-25'], ['Rouen', '1944-08-30'], ['Brest', '1944-09-18']];
module.exports = makeOverlord; module.exports.MILESTONES = MILESTONES; module.exports.WIN = WIN; module.exports.START = START;

if (require.main === module) {
  const cs = +(process.argv[2] || 1), hours = +(process.argv[3] || 72), seed = +(process.argv[4] || 12345);
  const t0 = Date.now(), sc = makeOverlord(cs), S = createSim(sc, -1, seed, {}); S.setup();
  const nA = sc.forms.filter(f => f.s === 0).length, nG = sc.forms.filter(f => f.s === 1).length;
  console.log('Overlord: ' + sc.w + ' x ' + sc.h + ' km, cell ' + cs + ' km; roads ' + sc.roads.length + ', rail ' + sc.rails.length + ', towns ' + sc.towns.length + ', objectives ' + sc.vp.length + ', bridges ' + S.map.bridges.length);
  console.log('  ' + nA + ' Allied and ' + nG + ' German divisions, ' + S.subs.length + ' battalions; Allied airfields ' + sc.sides[0].bases.length + ', German ' + sc.sides[1].bases.length + '; setup ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  const own = () => { const c = [0, 0]; for (const v of S.vp) c[v.own]++; return c; }, names = n => S.vp.filter(v => v.own === 0).map(v => v.n);
  let g = 0; const t1 = Date.now(), step = 60, took = {}, held = {};
  const vpOf = n => S.vp.find(v => v.n === n || v.n.startsWith(n + '-') || v.n.startsWith(n + ' '));
  while (!S.over && g < hours * 60) { S.advance(step); g += step;
    for (const [n] of MILESTONES) { const v = vpOf(n); if (!v) continue; const c = S.clock(S.t).slice(0, 11).trim();
      if (v.own === 0) { if (!took[n]) took[n] = c; if (!held[n]) held[n] = c; } else held[n] = null; }   // took: first entered; held: in Allied hands from this date to the end
    if (g % (24 * 60) === 0) { const act = S.forms.filter(F => F.active && !F.dead); console.log('  ' + S.clock(S.t).slice(0, 16) + ' | ' + ((Date.now() - t1) / 1000).toFixed(0) + ' s | on map A ' + act.filter(F => F.s === 0).length + ' G ' + act.filter(F => F.s === 1).length + ' | losses ' + S.losses.map(v => v.toFixed(0)).join(' / ') + ' | objectives A ' + own()[0] + ' of ' + S.vp.length + (S.pol ? ' | standing ' + Math.round(S.polComposite()) + ' (' + Object.keys(S.pol.aud).map(k => k[0] + Math.round(S.pol.aud[k])).join(' ') + ')' : '') + ' | ' + names().slice(0, 8).join(', ')); } }
  const sec = (Date.now() - t1) / 1000;
  console.log('Milestones (held from / first entered / history): ' + MILESTONES.map(([n, d]) => n + ' ' + (held[n] || '-') + ' / ' + (took[n] || '-') + ' / ' + d.slice(5)).join('; '));
  if (process.argv[5]) fs.writeFileSync(process.argv[5], JSON.stringify({ seed, hours: g / 60, took, held, losses: S.losses, own: own(), standing: S.pol ? Object.assign({ composite: S.polComposite() }, S.pol.aud) : null }));
  console.log('Result: ' + (g / 60).toFixed(0) + ' game h in ' + sec.toFixed(1) + ' s = ' + Math.round(g * 60 / sec) + 'x real time');
}

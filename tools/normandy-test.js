// Real-map test: Normandy window of the slice with the step 4 terrain, roads, rail and towns, and divisions from
// data/oob placed along a July 1944 line (test placement, not a historical scenario). AI against AI.
// node tools/normandy-test.js [cs] [hours]
const E = require('./load-engine')(), { createSim, SCENARIOS, divForm } = E;
const realMap = require('./realmap');
const fs = require('fs'), path = require('path');
const WIN = { x0: 230, y0: 130, w: 200, h: 190 };   // Cap de la Hague to Lisieux, the coast to Domfront (slice game km)

function makeNormandy(cs) {
  const base = SCENARIOS.find(s => s.id === 'falaise');
  const m = realMap(Object.assign({ cs }, WIN));
  const A = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'oob', 'allied-1944.json'), 'utf8'));
  const G = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'oob', 'german-1944.json'), 'utf8'));
  // test front: Lessay - St-Lo - Caumont - Caen, in window km (St-Lo is at slice 301.5, 211.7)
  const front = [[32, 88], [52, 84], [71, 82], [90, 84], [108, 80], [124, 77]];
  const at = (f, off) => { const k = f * (front.length - 1), i = Math.min(front.length - 2, Math.floor(k)), u = k - i; return [front[i][0] + (front[i + 1][0] - front[i][0]) * u, front[i][1] + (front[i + 1][1] - front[i][1]) * u + off]; };
  const allied = A.divisions.filter(d => d.arrive <= '1944-07-10').slice(0, 24), german = G.divisions.filter(d => d.position0606).slice(0, 16);
  const forms = [];
  allied.forEach((d, i) => { const [x, y] = at((i + .5) / allied.length, -5 - (i % 2) * 5);
    const f = divForm({ tpl: d.tpl, s: 0, n: d.name, cmd: d.commanders[d.commanders.length - 1].name, ag: .6, sk: .6, regs: d.regs.slice(0, 3), x, y });
    f.ai = [{ t: 0, path: [], line: [[x - 3, y + 22], [x + 3, y + 22]] }]; forms.push(f); });
  german.forEach((d, i) => { const [x, y] = at((i + .5) / german.length, 5 + (i % 2) * 6);
    forms.push(divForm({ tpl: d.tpl, s: 1, n: d.name, cmd: 'Kdr', ag: .5, sk: .6, regs: ['1', '2', '3'], x, y })); });
  const sides = base.sides.map((sd, s) => Object.assign({}, sd, { rear: s ? [0, 1] : [0, -1], pocket: undefined, assets: sd.assets || [],
    sources: [0, 1, 2].map(k => ({ n: (s ? 'German' : 'Allied') + ' depot ' + k, x: 40 + k * 50, y: s ? m.h - 3 : 62, stock: 200, rate: 12 })),
    bases: [0, 1].map(k => ({ n: (s ? 'German' : 'Allied') + ' airfields ' + (k + 1), x: 60 + k * 70, y: s ? m.h - 1 : 60 })) }));
  const vp = m.towns.filter(t => t[3] >= 2).map(t => [t[0], t[1], t[2], 10, t[2] > 85 ? 1 : 0]);
  return Object.assign({}, base, m, { id: 'normandy-real', title: 'Normandy real-map test', ownCell: 1, hours: 48, start: '1944-07-25T06:00',
    forest: [], rough: [], marsh: [], bridges: [], vp, weather: Array(10).fill('clear'), sides, forms, front: undefined, thin: undefined, halt: undefined, beach: undefined, mines: undefined });
}
module.exports = makeNormandy;
if (require.main === module) {
  const cs = +(process.argv[2] || .5), hours = +(process.argv[3] || 24);
  const t0 = Date.now(), sc = makeNormandy(cs), S = createSim(sc, -1, 12345, {}); S.setup();
  const tl = S.transport ? S.transport.net : null;
  console.log('Normandy: ' + sc.w + ' x ' + sc.h + ' km, cell ' + cs + ' km; roads ' + sc.roads.length + ', rail ' + sc.rails.length + ', rivers ' + sc.rivers.length + ', towns ' + sc.towns.length + ', bridges ' + S.map.bridges.length);
  console.log('  ' + S.forms.length + ' divisions, ' + S.subs.length + ' battalions; setup ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  let noRoute = 0; const oldWarn = console.warn; console.warn = (...a) => { if (String(a[0]).includes('route')) noRoute++; };
  const t1 = Date.now(); let g = 0, maxHalt = 0; while (!S.over && g < hours * 60) { S.advance(60); g += 60; maxHalt = Math.max(maxHalt, S.forms.filter(F => /no route/i.test(F.status || '')).length); if (g % 360 === 0) console.log('  ' + g / 60 + ' h: ' + ((Date.now() - t1) / 1000).toFixed(0) + ' s, losses ' + S.losses.map(v => v.toFixed(0)).join(' / ') + ', units lost ' + S.subs.filter(u => u.dead).length); }
  console.warn = oldWarn;
  const sec = (Date.now() - t1) / 1000, halts = S.forms.filter(F => /no route/i.test(F.status || '')).length;
  console.log('Result: ' + g / 60 + ' game h in ' + sec.toFixed(1) + ' s = ' + Math.round(g * 60 / sec) + 'x real time; most divisions halted at once ' + maxHalt + ', divisions halted at the end with no route ' + halts);
}

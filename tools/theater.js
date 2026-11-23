// Theater stress test: a synthetic 220 x 140 km map (Normandy-sized) with about 100 template divisions, AI against AI.
// Allies hold the north half and attack south; Germans hold the south half. Placeholder terrain and roads.
// node tools/theater.js [alliedDivs] [germanDivs] [hours]
const E = require('./load-engine')(), { createSim, SCENARIOS, divForm } = E;
function makeTheater(nA, nG) {
  const base = SCENARIOS.find(s => s.id === 'falaise'); let r = 1944; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const W = 220, H = 140, roads = [], towns = [], vp = [];
  for (let x = 15; x < W; x += 25) roads.push([x % 50 === 15 ? 3 : 2, [[x, 0], [x + 6, 45], [x - 4, 95], [x + 3, H]]]);   // north-south roads
  for (let y = 12; y < H; y += 22) roads.push([y % 44 === 12 ? 3 : 2, [[0, y], [70, y + 5], [150, y - 4], [W, y + 2]]]); // east-west roads
  for (let x = 15; x < W; x += 50) for (let y = 12; y < H; y += 44) towns.push(['Town ' + towns.length, x + 2, y + 1, 2]);
  for (const t of towns) if (t[2] > 40 && t[2] < 100) vp.push([t[0], t[1], t[2], 10, t[2] > 70 ? 0 : 1]);
  const forest = [], rough = []; for (let k = 0; k < 30; k++) forest.push([rnd() * W, rnd() * H, 2 + rnd() * 4, 1]); for (let k = 0; k < 12; k++) rough.push([rnd() * W, rnd() * H, 3 + rnd() * 4]);
  const forms = [], tA = ['us_inf', 'us_inf', 'us_arm', 'uk_inf', 'uk_arm'], tG = ['ge_inf', 'ge_inf', 'ge_pz', 'ge_fj'];
  for (let i = 0; i < nA; i++) { const x = 8 + (i % 20) * 10.5, y = 78 + Math.floor(i / 20) * 9, tpl = tA[i % tA.length];
    const f = divForm({ tpl, s: 0, n: 'Allied Div ' + (i + 1), cmd: 'Cdr A' + i, ag: .5 + rnd() * .3, sk: .5 + rnd() * .3, regs: ['1st', '2nd', '3rd'], x, y });
    f.ai = [{ t: 0, path: [], line: [[x - 4, y - 22], [x + 4, y - 22]] }]; forms.push(f); }
  for (let i = 0; i < nG; i++) { const x = 8 + (i % 20) * 10.5, y = 62 - Math.floor(i / 20) * 12, tpl = tG[i % tG.length];
    forms.push(divForm({ tpl, s: 1, n: 'German Div ' + (i + 1), cmd: 'Kdr G' + i, ag: .5 + rnd() * .3, sk: .5 + rnd() * .3, regs: ['1', '2', '3'], x, y })); }
  const sides = base.sides.map((sd, s) => Object.assign({}, sd, { rear: s ? [0, -1] : [0, 1], pocket: undefined, assets: sd.assets || [],
    sources: [0, 1, 2, 3].map(k => ({ n: (s ? 'German' : 'Allied') + ' depot ' + k, x: 25 + k * 55, y: s ? 3 : H - 3, stock: 200, rate: 12 })),
    bases: [0, 1].map(k => ({ n: (s ? 'German' : 'Allied') + ' airfields ' + (k + 1), x: 60 + k * 100, y: s ? 1 : H - 1 })) }));
  return Object.assign({}, base, { id: 'theater', title: 'Theater stress test', w: W, h: H, cs: 1, ownCell: 1, hours: 72, start: '1944-07-25T06:00',
    elev: { base: 60, noise: [55, 14], hills: [[60, 40, 15, 180], [150, 30, 20, 150], [100, 110, 15, 120]] }, forest, rough, marsh: [], rivers: [], bridges: [], roads, towns, vp,
    weather: Array(10).fill('clear'), sides, forms, front: undefined, thin: undefined, halt: undefined, sea: undefined, beach: undefined, mines: undefined });
}
module.exports = makeTheater;
if (require.main === module) {
  const nA = +(process.argv[2] || 60), nG = +(process.argv[3] || 40), hours = +(process.argv[4] || 24);
  const t0 = Date.now(), sc = makeTheater(nA, nG), S = createSim(sc, -1, 12345, {}); S.setup(); const tSet = Date.now() - t0;
  console.log('Theater: map ' + sc.w + ' x ' + sc.h + ' km, cell ' + sc.cs + ' km; ' + S.forms.length + ' divisions, ' + S.subs.length + ' battalions; setup ' + (tSet / 1000).toFixed(1) + ' s');
  const t1 = Date.now(); let g = 0; while (!S.over && g < hours * 60) { S.advance(60); g += 60; if (g % 360 === 0) console.log('  ' + g / 60 + ' h: ' + ((Date.now() - t1) / 1000).toFixed(0) + ' s, losses ' + S.losses.map(v => v.toFixed(0)).join(' / ') + ', units lost ' + S.subs.filter(u => u.dead).length); }
  const sec = (Date.now() - t1) / 1000; console.log('Result: ' + g / 60 + ' game h in ' + sec.toFixed(1) + ' s = ' + Math.round(g * 60 / sec) + 'x real time');
}

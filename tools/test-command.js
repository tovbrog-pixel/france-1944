// Command layer test: groups four US formations at Falaise into a provisional corps, gives the corps one order,
// and checks that the sectors run left to right without crossing routes.
const { createSim, SCENARIOS, attachCommand } = require('./load-engine')();
const sc = SCENARIOS.find(s => s.id === 'falaise');
const S = createSim(sc, 0, 12345, {}); S.setup(); attachCommand(S);
const us = S.forms.filter(F => F.s === 0 && F.active && !F.arr && /Armored|Infantry|CC/.test(F.n)).slice(0, 4);
const C = S.mkCommand({ n: 'Provisional Corps', s: 0, level: 'corps', cmd: { n: 'Test commander', ag: .5, sk: .6 }, forms: us });
const pos = F => { const u = F.subs.filter(u => u.active && !u.dead); return [u.reduce((a, v) => a + v.x, 0) / u.length, u.reduce((a, v) => a + v.y, 0) / u.length]; };
const c = us.map(pos), cx = c.reduce((a, p) => a + p[0], 0) / c.length, cy = c.reduce((a, p) => a + p[1], 0) / c.length;
const tx = sc.w / 2 - cx, ty = sc.h / 2 - cy, tl = Math.hypot(tx, ty), ux = tx / tl, uy = ty / tl;   // toward the map centre
const ox = cx + ux * 14, oy = cy + uy * 14, obj = [[ox - uy * 9, oy + ux * 9], [ox + uy * 9, oy - ux * 9]];   // 18 km objective line, 14 km ahead
const way = [[cx + ux * 6, cy + uy * 6]];
console.log('Corps of', us.map(F => F.n).join(' | '));
const plan = S.planCommandOrder(C, way, obj, {});
for (const q of plan) console.log((q.reserve ? 'RESERVE ' : 'sector  ') + q.child.n.padEnd(40) + ' line ' + q.line.map(p => p.map(v => v.toFixed(1)).join(',')).join(' -> '));
S.log.length = 0; S.issueCommandOrder(C, way, obj, {});
let g = 0; while (g < 8 * 60) { S.advance(30); g += 30; }
const cross = S.log.filter(l => /crosses that of/.test(l.txt || l.m || JSON.stringify(l)));
console.log('corps status:', C.status);
const mine = cross.filter(l => us.filter(F => JSON.stringify(l).includes(F.n)).length >= 2); console.log('route crossings between corps formations:', mine.length); mine.forEach(l => console.log('  ', JSON.stringify(l).slice(0, 200)));
for (const F of us) { const p = pos(F); console.log(F.n.padEnd(40), 'status:', F.status, '| moved to', p.map(v => v.toFixed(1)).join(',')); }

// Army test: two provisional corps of two formations each under one army; one army order.
{
  const S2 = createSim(sc, 0, 12345, {}); S2.setup(); attachCommand(S2);
  const f = S2.forms.filter(F => F.s === 0 && F.active && !F.arr && /Armored|Infantry|CC/.test(F.n)).slice(0, 4);
  const k1 = S2.mkCommand({ n: 'I Corps (test)', s: 0, level: 'corps', cmd: { ag: .7, sk: .6 }, forms: f.slice(0, 2) });
  const k2 = S2.mkCommand({ n: 'II Corps (test)', s: 0, level: 'corps', cmd: { ag: .7, sk: .6 }, forms: f.slice(2, 4) });
  const A = S2.mkCommand({ n: 'Test Army', s: 0, level: 'army', cmd: { ag: .7, sk: .7 }, forms: [k1, k2] });
  S2.log.length = 0; const d = S2.issueCommandOrder(A, way, obj, {});
  let g = 0; while (g < 8 * 60) { S2.advance(30); g += 30; }
  console.log('\nArmy staff delay', d.toFixed(0), 'min; army:', A.status, '| I Corps:', k1.status, '| II Corps:', k2.status);
  const cr = S2.log.filter(l => /crosses that of/.test(JSON.stringify(l)) && f.filter(F => JSON.stringify(l).includes(F.n)).length >= 2);
  console.log('route crossings inside the army:', cr.length);
  for (const F of f) console.log(F.n.padEnd(40), 'status:', F.status);
}

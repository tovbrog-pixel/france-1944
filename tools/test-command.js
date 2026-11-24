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

// Fixes A1 and A2 (tutorial playtest, 24 Nov 2026): Exercise Cumberland, II Corps. The corps order is drawn as the page draws it,
// starting from one division, so the corps route begins beside that division and behind or across the others.
// A1: at a river with no bridge held, or with an enemy town just beyond the line, the armored division is the reserve.
// A2: no two divisions' routes cross, and no 'lines cross' report in 6 game hours.
{
  const sc2 = SCENARIOS.find(s => s.id === 'tutorial-tn'); let bad = 0;
  const X = (a, b, c, d) => { const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1], den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return false; const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den, u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den; return t > 0 && t < 1 && u > 0 && u < 1 ? [a[0] + rx * t, a[1] + ry * t] : null; };
  const cases = [['step 8: Watertown to the river at Carthage', '2nd Infantry', [[20.8, 35.3], [30, 31], [37.2, 20.2]], true],
    ['jumbled: drawn from the right-hand division toward Bellwood, across the others', '3rd Infantry', [[25, 25], [20, 22], [15, 20.5]], false],
    ['jumbled: drawn from the armored division east to Gordonsville', '1st Armored', [[20.8, 35.3], [30, 31], [38, 28.5]], false]];
  for (const seed of [7, 79]) for (const [name, from, way2, wantRes] of cases) {
    const T = createSim(sc2, 0, seed, {}); T.setup(); const f = n => T.forms.find(F => F.n.indexOf(n) === 0), D = f(from), C2 = D.parent;
    const cen = F => { const u = F.subs.filter(u => u.active && !u.dead); return [u.reduce((a, v) => a + v.x, 0) / u.length, u.reduce((a, v) => a + v.y, 0) / u.length]; };
    const path = [cen(D)].concat(way2), n = path.length, a = path[n - 2], b = path[n - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / l, dy = (b[1] - a[1]) / l, hw = Math.max(1.2, T.leads(D).length * .65), line = [[b[0] - dy * hw, b[1] + dx * hw], [b[0] + dy * hw, b[1] - dx * hw]];
    const plan2 = T.planCommandOrder(C2, path, line, {}), routes = plan2.map(q => [cen(q.child)].concat(q.path, [[(q.line[0][0] + q.line[q.line.length - 1][0]) / 2, (q.line[0][1] + q.line[q.line.length - 1][1]) / 2]]));
    let geo = 0; for (let i = 0; i < routes.length; i++) for (let j = i + 1; j < routes.length; j++) for (let p = 1; p < routes[i].length; p++) for (let q = 1; q < routes[j].length; q++) { const x = X(routes[i][p - 1], routes[i][p], routes[j][q - 1], routes[j][q]); if (x && Math.hypot(x[0] - routes[i][0][0], x[1] - routes[i][0][1]) > 1 && Math.hypot(x[0] - routes[j][0][0], x[1] - routes[j][0][1]) > 1) geo++; }   // a meeting within 1 km of a division's start is its assembly area, as in the engine
    const res = plan2.find(q => q.reserve), fwdArm = plan2.some(q => !q.reserve && /Armored/.test(q.child.n));
    T.log.length = 0; T.issueCommandOrder(C2, path, line, {}); let g2 = 0; while (g2 < 6 * 60) { T.advance(30); g2 += 30; }
    const said = T.log.filter(l => /crosses that of/.test(l.txt)).length, okRes = !wantRes || (res && /Armored/.test(res.child.n) && !fwdArm), ok = !geo && !said && okRes; if (!ok) bad++;
    console.log((ok ? 'PASS ' : 'FAIL ') + 'seed ' + seed + ', ' + name + ': reserve ' + (res ? res.child.n : 'none') + ', routes crossing ' + geo + ', lines-cross reports in 6 h ' + said);
  }
  console.log(bad ? 'A1/A2 cases: ' + bad + ' FAILED' : 'A1/A2 cases: all pass'); if (bad) process.exitCode = 1;
}

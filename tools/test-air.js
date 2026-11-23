// Air tests at Falaise: (1) a German road move under Allied air goes by night only; (2) an Allied column forced under full
// enemy air by day is attacked; (3) German interdiction cuts the test rail line and the Allied commander takes the road instead.
const { createSim, SCENARIOS, attachTransport } = require('./load-engine')();
const base = SCENARIOS.find(s => s.id === 'falaise');
const cen = F => { const a = F.subs.filter(u => u.active && !u.dead); return [a.reduce((s, u) => s + u.x, 0) / a.length, a.reduce((s, u) => s + u.y, 0) / a.length]; };
function follow(S, F, hours, label) { let last = ''; for (let g = 0; g < hours * 60; g += 10) { S.advance(10); const st = (F.transit ? F.transit.ph : 'tactical') + ' | ' + F.status; if (st !== last) { console.log('  t+' + (g / 60).toFixed(1) + 'h (' + S.clock().slice(-5) + ') ' + st); last = st; } if (!F.transit && g > 60) break; } S.log.filter(m => m.who === F.n && /fighter|night|Column|rail|Moving|Caught/.test(m.txt)).slice(0, 6).forEach(m => console.log('   > ' + m.txt)); }
{ // 1
  const S = createSim(base, 1, 12345, {}); S.setup(); attachTransport(S);
  console.log('Allied air threat over the German rear:', S.airThreat(1).toFixed(2), '| German air threat over the Allied rear:', S.airThreat(0).toFixed(2));
  const al = S.subs.filter(u => u.s === 0 && u.active && !u.dead);
  const c = S.forms.filter(F => F.s === 1 && F.active && F.subs.some(u => u.active)).map(F => ({ F, p: cen(F), d: Math.min(...al.map(u => Math.hypot(u.x - cen(F)[0], u.y - cen(F)[1]))) })).sort((a, b) => b.d - a.d)[0];
  const tgt = [sc => 0][0]; const line = [[c.p[0] + 14, c.p[1] - 1], [c.p[0] + 16, c.p[1] + 1]];
  console.log('\n1. German move:', c.F.n, 'deepest in German ground,', c.d.toFixed(1), 'km from Allied units'); S.issueOrder(c.F, [], line, {}); follow(S, c.F, 30);
}
{ // 2
  const sc = Object.assign({}, base, { sides: base.sides.map((sd, i) => i === 0 ? Object.assign({}, sd, { airThreat: 1 }) : sd) });
  let hits = 0, colH = 0, lossStr = 0; console.log('\n2. Allied road moves with enemy air threat forced to 1, 20 runs with different seeds:');
  for (let seed = 1; seed <= 20; seed++) { const S = createSim(sc, 0, seed, {}); S.setup(); attachTransport(S); const F = S.forms.find(f => f.n.startsWith('47th Infantry'));
    const s0 = F.subs.reduce((t, u) => t + u.str * u.size, 0); S.issueOrder(F, [], [[24, 68], [30, 68]], {});
    for (let g = 0; g < 8 * 60; g += 10) { S.advance(10); const C = S.columns.find(c => c.F === F); if (C && C.ph === 'move' && !S.night) colH += 10 / 60; }
    const C = S.columns.find(c => c.F === F); hits += (C && C.airHits) || 0; lossStr += s0 - F.subs.reduce((t, u) => t + u.str * u.size, 0); }
  console.log('   ' + hits + ' attacks in ' + colH.toFixed(1) + ' daylight column-hours (' + (hits / Math.max(.1, colH)).toFixed(2) + ' per hour; setting 0.12)');
}
{ // 3
  const sc = Object.assign({}, base, { rails: [[[26, 99], [45, 98], [65, 97], [85, 96], [97, 90], [99, 78]]], sides: base.sides.map((sd, i) => i === 1 ? Object.assign({}, sd, { interdict: 1 }) : sd) });
  const S = createSim(sc, 0, 12345, {}); S.setup(); attachTransport(S); const F = S.forms.find(f => f.n.startsWith('47th Infantry'));
  console.log('\n3. Rail line before interdiction:', S.planMove(F, [], [[95, 64], [101, 64]]).mode);
  S.cutNetwork(65, 97, .5, 'rail', 36); console.log('   rail cut near 65,97 for 36 hours; plan now:', S.planMove(F, [], [[95, 64], [101, 64]]).mode);
  for (let g = 0; g < 40 * 60; g += 60) S.advance(60); console.log('   after 40 hours (engineers repair, new cuts every 6 h):', S.planMove(F, [], [[95, 64], [101, 64]]).mode, '|', S.log.filter(m => /interdiction/.test(m.txt)).length, 'interdiction cuts reported');
}

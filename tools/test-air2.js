// Airfield and air transport tests on copies of Falaise.
const { createSim, SCENARIOS, attachTransport, attachAir, divForm } = require('./load-engine')();
const base = SCENARIOS.find(s => s.id === 'falaise');
const side = (i, o) => base.sides.map((sd, k) => k === i ? Object.assign({}, sd, o) : sd);
const run = (S, h) => { for (let g = 0; g < h * 60; g += 30) S.advance(30); };
{ // A. engineers build a landing ground; groups based off the map in England move onto it
  const sc = Object.assign({}, base, { sides: side(0, { bases: [{ n: 'Fields in southern England', x: 50, y: -150 }, { n: 'Fields in Kent', x: 90, y: -170 }] }) });
  const S = createSim(sc, 0, 12345, {}); S.setup(); attachTransport(S); attachAir(S);
  const eng = S.subs.filter(u => u.s === 0 && u.cls === 'eng' && u.active && !u.dead).slice(0, 2), x = eng[0].x, y = eng[0].y; console.log('   engineer battalions sent:', eng.map(u => u.n).join(', '));
  for (const u of eng) S.detach(u.f, [u.f.subs.indexOf(u)], x, y);
  const before = S.air[0].groups.map(g => S.air[0].bases[g.base].n);
  const site = S.buildAirfield(0, x, y); console.log('A. site', site ? site.n : 'refused', 'with', eng.length, 'engineer battalions; front reference', S.frontRef(0).map(v => v.toFixed(0)).join(','));
  run(S, 80); console.log('   after 80 h: build progress', (site.prog * 100).toFixed(0) + '%, bases', S.air[0].bases.map(b => b.n).join(' | '));
  run(S, 12);
  console.log('   group bases after the field opened:'); S.air[0].groups.forEach((g, i) => console.log('     ' + g.n.padEnd(28) + before[i] + '  ->  ' + S.air[0].bases[g.base].n));
}
{ // B. a German field inside Allied-held ground is overrun; its groups lose aircraft and fall back; the Allies repair it
  const sc = Object.assign({}, base, { sides: side(1, { bases: [{ n: 'Field near Argentan', x: 75, y: 50 }, { n: 'Forward field Mayenne', x: 26, y: 96 }], groups: base.sides[1].groups.map((g, i) => i === 0 ? [g[0], g[1], g[2], 1, g[4]] : g) }) });
  const S = createSim(sc, 0, 12345, {}); S.setup(); attachAir(S); const jg = S.air[1].groups[0], t0 = jg.total; run(S, 2);
  console.log('\nB. JG 1 / JG 26 aircraft', t0, '->', jg.total, '| now based at', S.air[1].bases[jg.base].n, '| Allied bases:', S.air[0].bases.map(b => b.n + ' (cond ' + b.cond.toFixed(1) + ')').join(' | '));
}
{ // C-F. troop carrier fleet: an airborne division in England drops in lifts; supply drops and airlifts use the same aircraft
  const div = Object.assign(divForm({ tpl: 'us_abn', s: 0, n: '82nd Airborne Division (test)', cmd: 'T', ag: .6, sk: .7, regs: ['505th', '508th', '325th'], x: 60, y: 99 }), { arr: { mode: 'road', t: 9999 } });
  const sc = Object.assign({}, base, { forms: base.forms.concat([div]), sides: side(0, { transport: { aircraft: 400 } }) });
  const S = createSim(sc, 0, 12345, {}); S.setup(); attachAir(S); const F = S.forms[S.forms.length - 1];
  const r = S.airborneOp(F, 70, 90, {}); console.log('\nC. airborne op:', JSON.stringify(r));
  run(S, 36); S.log.filter(m => m.who === F.n).forEach(m => console.log('   t+' + (m.t / 60).toFixed(1) + 'h ' + m.txt));
  const on = F.subs.filter(u => u.active && !u.dead); console.log('   on the ground:', on.length + '/' + F.subs.length, '| mean distance from drop zone', (on.reduce((a, u) => a + Math.hypot(u.x - 70, u.y - 90), 0) / on.length).toFixed(1), 'km | fleet available', S.fleet[0].avail);
  const G = S.forms.find(f => f.s === 0 && f.active && f !== F); const a0 = S.fleet[0].avail; S.reqDrop(0, G, G.subs[0].x, G.subs[0].y); run(S, 1);
  console.log('D. supply drop to', G.n, ': fleet', a0, '->', S.fleet[0].avail);
  const b = S.air[0].bases[0], n = S.airlift(0, b.x, b.y, 100); console.log('E. airlift to', b.n + ':', n, 'aircraft, source stock', S.src[0].find(q => q.airlift).stock.toFixed(1));
  S.withdrawToRefit(F); console.log('F. withdrawn:', F.status, '| new drop now:', JSON.stringify(S.airborneOp(F, 70, 90)));
}

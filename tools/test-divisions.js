// Division test: a US infantry division built from the template, added to the Falaise map, ordered to a line in its own ground.
// Expect: two regiments forward with their battalions side by side, one regiment about 3.5 km back in reserve.
const { createSim, SCENARIOS, attachTransport, divForm, DIVTPL } = require('./load-engine')();
const base = SCENARIOS.find(s => s.id === 'falaise');
const div = divForm({ tpl: 'us_inf', s: 0, n: '4th Infantry Division (test)', cmd: 'Test commander', ag: .5, sk: .7, regs: ['8th', '12th', '22nd'], x: 44, y: 99 });
const sc = Object.assign({}, base, { forms: base.forms.concat([div]) });
const S = createSim(sc, 0, 12345, {}); S.setup(); attachTransport(S);
const F = S.forms[S.forms.length - 1];
console.log(F.n + ':', F.subs.length, 'units in', F.regs.length, 'groups:', F.regs.map(R => R.n + ' (' + R.subs.length + ')').join(', '));
console.log('templates available:', Object.keys(DIVTPL).join(', '));
const line = [[48, 93], [60, 92]];
S.issueOrder(F, [], line, {}); let g = 0;
while (g < 18 * 60) { S.advance(30); g += 30; if (!F.transit && /Holding|On objective/.test(F.status)) break; }
console.log('after', (g / 60).toFixed(1), 'h:', F.status, '| reserve:', F.resReg ? F.resReg.n : 'none');
const ax = line[1][0] - line[0][0], ay = line[1][1] - line[0][1], al = Math.hypot(ax, ay), ux = ax / al, uy = ay / al, nx = -uy, ny = ux;
const rows = F.subs.filter(u => u.active && !u.dead && u.reg && u.reg.role === 'man').map(u => ({ r: u.reg.n, n: u.n, along: (u.x - line[0][0]) * ux + (u.y - line[0][1]) * uy, back: Math.abs((u.x - line[0][0]) * nx + (u.y - line[0][1]) * ny) })).sort((a, b) => a.along - b.along);
for (const q of rows) console.log('  ' + q.n.padEnd(20) + q.r.padEnd(14) + ' along ' + q.along.toFixed(1).padStart(5) + ' km   from line ' + q.back.toFixed(1) + ' km');

// every template builds into a valid formation
{ const all = Object.keys(DIVTPL).map((k, i) => divForm({ tpl: k, s: /^ge/.test(k) ? 1 : 0, n: k + ' test', cmd: 'T', regs: ['1', '2', '3'], x: 50 + i, y: /^ge/.test(k) ? 50 : 99 }));
  const S2 = createSim(Object.assign({}, base, { forms: base.forms.concat(all) }), 0, 1, {}); S2.setup();
  for (const F of S2.forms.slice(-all.length)) console.log('  template ok:', F.n.padEnd(14), F.subs.length + ' units (incl. HQ),', F.regs.filter(R => R.role === 'man').length + ' manoeuvre groups'); }

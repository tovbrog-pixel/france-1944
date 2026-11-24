// Headless play of Exercise Cumberland (tutorial-tn) following the umpire's plan to the letter:
// step 5 and 6 (1st Infantry Division toward Hartsville, Attack row on Probe), step 8 (one II Corps order from Watertown
// to the river at Carthage), step 10 (155 mm battalion in direct support of the 1st Division, engineers attached),
// step 12 (one interdiction zone north of Dixon Springs), step 13 (the parachute drop left as planned). Then the clock runs.
//   node tools/tutorial-run.js <seed> [hours] [south|north] [log]
// 'south' ends the 1st Division's line just south of Hartsville bridge (the step 5 wording before fix B1); 'north' ends it in Hartsville.
const { createSim, SCENARIOS } = require('./load-engine')();
const seed = +(process.argv[2] || 79), hours = +(process.argv[3] || 48), mode = process.argv[4] || 'north', showLog = process.argv[5] === 'log';
const sc = SCENARIOS.find(s => s.id === 'tutorial-tn');
const S = createSim(sc, 0, seed, {}); S.setup();
const F = n => S.forms.find(f => f.n.indexOf(n) === 0);
const cen = f => { const u = f.subs.filter(u => u.active && !u.dead); return [u.reduce((a, v) => a + v.x, 0) / u.length, u.reduce((a, v) => a + v.y, 0) / u.length]; };
const lineAt = (f, path) => { const n = path.length, a = path[n - 2], b = path[n - 1]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const hw = Math.max(1.2, S.leads(f).length * .65); return [[b[0] - dy * hw, b[1] + dx * hw], [b[0] + dy * hw, b[1] - dx * hw]]; };   // the objective line the page draws across the end of a line of advance
const d1 = F('1st Infantry Division'), d2 = F('2nd Infantry Division'), d3 = F('3rd Infantry Division'), a1 = F('1st Armored Division'), para = F('Parachute Regiment');
// step 5 and 6
const p1 = [cen(d1), [8.5, 17], [12, 11], [15.5, 6.6]].concat(mode === 'north' ? [[16.6, 5.2], [17.2, 3.1]] : [[15.9, 6.2]]);
S.issueOrder(d1, p1, lineAt(d1, p1), { then: 'hold', press: 0 });
// step 8
const CORPS = process.env.CORPS || 'town', FOLLOW = process.env.FOLLOW !== '0';   // CORPS=town ends the corps line in Carthage; FOLLOW=0 leaves out the step 7 follow-up (the armor west to Dixon Springs once Carthage is ours)
const p2 = [cen(d2), [20.8, 35.3], [30, 31]].concat(CORPS === 'town' ? [[37.6, 19.6], [36.9, 18.3]] : [[37.2, 20.2]]);
S.issueCommandOrder(d2.parent, p2, lineAt(d2, p2), { then: 'hold' });
// step 10
const pool = S.pool[0], gun = pool.findIndex(it => /155/.test(it.n)), eng = pool.findIndex(it => /Engineer/.test(it.n));
const sup0 = d1.stock / d1.cap; S.fires(0, gun, 'DS', d1.id); const sup1 = d1.stock / d1.cap; S.attach(d1, pool[eng]); const sup2 = d1.stock / d1.cap;
// step 12
S.addInt(0, 28, 4);
const pct = v => Math.round(v * 100) + '%';
console.log('seed', seed, mode, '| 1st Division supply before attachments', pct(sup0), 'after the 155 mm battalion', pct(sup1), 'after the engineers', pct(sup2));
let g = 0, carthage = null, contact = null, li = 0; const curve = [];
while (!S.over && g < hours * 60) { S.advance(30); g += 30;
  if (g % 60 === 0 && g <= 720) curve.push(pct(d1.stock / d1.cap));
  if (carthage == null && S.vp.find(v => v.n === 'Carthage').own === 0) carthage = g / 60;
  const brg = S.map.bridges.find(b => /Cordell/.test(b.name));
  if (FOLLOW && carthage != null && !a1.west && !a1.dead && brg.intact && S.ownAt(brg.x, brg.y) === 0 && g / 60 >= carthage + 1) { a1.west = 1; const pw = [cen(a1), [38.5, 22], [37.6, 19.6], [36.9, 18.3], [34, 12], [32.4, 8], [27.9, 7.4]];
    if (process.env.FOLLOW === 'corps') S.issueCommandOrder(d2.parent, pw.slice(2), lineAt(d2, pw), { then: 'hold' }); else { S.leaveCorpsOrder(a1); S.issueOrder(a1, pw, lineAt(a1, pw), { then: 'hold' }); } console.log('follow-up order at hour', g / 60); }
  for (; li < S.log.length; li++) { const l = S.log[li]; if (contact == null && l.who === d1.n && /contact|engag|attack|fire|enemy/i.test(l.txt) && l.t > 0) contact = { h: l.t / 60, txt: l.txt }; if (showLog && l.s === 0) console.log(S.clock(l.t).slice(-8), (l.who || '').padEnd(30), l.txt); }
}
const score = S.score();
console.log('result: Blue', score[0], 'Red', score[1], '| losses Blue', S.losses[0].toFixed(1), 'Red', S.losses[1].toFixed(1), '| towns:', S.vp.map(v => v.n + '=' + ['Blue', 'Red'][v.own]).join(', '), '| Carthage fell at hour', carthage == null ? 'never' : carthage);
console.log('1st Division supply, hours 1 to 12:', curve.join(' '), '| first report of the enemy:', contact ? contact.h.toFixed(1) + ' h: ' + contact.txt : 'none');
console.log('corps:', d2.parent.log.map(l => S.clock(l.t).slice(-8) + ' ' + l.txt).join(' / '));

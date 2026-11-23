// Command AI test: a provisional corps at Falaise attacks; after 3 hours one forward formation is shattered by hand.
// Expect: the corps commits its reserve into that sector and pulls the shattered formation back to rest.
const { createSim, SCENARIOS, attachCommand, attachTransport } = require('./load-engine')();
const sc = SCENARIOS.find(s => s.id === 'falaise');
const S = createSim(sc, 0, 12345, {}); S.setup(); attachTransport(S); attachCommand(S);
const us = S.forms.filter(F => F.s === 0 && F.active && !F.arr && /Armored|Infantry|CC/.test(F.n)).slice(0, 4);
const C = S.mkCommand({ n: 'Provisional Corps', s: 0, level: 'corps', cmd: { ag: .5, sk: .6 }, forms: us });
const pos = F => { const u = F.subs.filter(u => u.active && !u.dead); return [u.reduce((a, v) => a + v.x, 0) / u.length, u.reduce((a, v) => a + v.y, 0) / u.length]; };
const c = us.map(pos), cx = c.reduce((a, p) => a + p[0], 0) / c.length, cy = c.reduce((a, p) => a + p[1], 0) / c.length;
const tx = sc.w / 2 - cx, ty = sc.h / 2 - cy, tl = Math.hypot(tx, ty), ux = tx / tl, uy = ty / tl;
const ox = cx + ux * 14, oy = cy + uy * 14, obj = [[ox - uy * 9, oy + ux * 9], [ox + uy * 9, oy - ux * 9]];
S.issueCommandOrder(C, [[cx + ux * 6, cy + uy * 6]], obj, {});
let hit = null;
for (let g = 0; g < 12 * 60; g += 30) {
  if (g === 180) { const q = C.order.plan.find(q => !q.reserve); hit = q.child; for (const u of hit.subs) if (u.active && !u.dead && u.cls !== 'hq') { u.str = Math.min(u.str, .3); u.coh = Math.min(u.coh, .2); } console.log('t+3.0h  shattered by hand:', hit.n); }
  S.advance(30);
}
console.log('corps log:'); C.log.forEach(l => console.log('  t+' + (l.t / 60).toFixed(1) + 'h ' + l.txt));
for (const F of us) console.log('  ' + F.n.padEnd(38) + F.status);

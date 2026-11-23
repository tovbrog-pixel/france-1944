// Transport test at Falaise: the Allied formation deepest in its own ground is ordered toward the front.
// Expect: a road move (no rails on this map), a release point short of known enemy, then a tactical order.
const { createSim, SCENARIOS, attachTransport } = require('./load-engine')();
const sc = SCENARIOS.find(s => s.id === process.argv[2] || s.id === 'falaise');
const S = createSim(sc, 0, 12345, {}); S.setup(); attachTransport(S);
console.log('network:', S.net.x.length, 'nodes,', S.net.adj.reduce((a, l) => a + l.length, 0) / 2, 'links');
const enemy = S.subs.filter(u => u.s === 1 && u.active && !u.dead);
const cen = F => { const a = F.subs.filter(u => u.active && !u.dead); return [a.reduce((s, u) => s + u.x, 0) / a.length, a.reduce((s, u) => s + u.y, 0) / a.length]; };
const cand = S.forms.filter(F => F.s === 0 && F.active && !F.dead && F.subs.some(u => u.active)).map(F => { const c = cen(F); return { F, c, d: Math.min(...enemy.map(e => Math.hypot(e.x - c[0], e.y - c[1]))) }; }).sort((a, b) => b.d - a.d);
const { F, c } = cand[0]; const e = enemy.reduce((b, u) => Math.hypot(u.x - c[0], u.y - c[1]) < Math.hypot(b.x - c[0], b.y - c[1]) ? u : b);
const tx = e.x, ty = e.y, dx = tx - c[0], dy = ty - c[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
const line = [[tx - uy * 3, ty + ux * 3], [tx + uy * 3, ty - ux * 3]];
console.log('formation:', F.n, '| at', c.map(v => v.toFixed(1)).join(','), '| nearest enemy', cand[0].d.toFixed(1), 'km away');
const plan = S.planMove(F, [], line); console.log('plan:', plan ? plan.mode + ', ' + plan.r.km.toFixed(1) + ' km of road, about ' + plan.r.hours.toFixed(1) + ' h, release at ' + plan.rel.x.toFixed(1) + ',' + plan.rel.y.toFixed(1) : 'none (stays tactical)');
const d = S.issueOrder(F, [], line, {}); console.log('preparation', Math.round(d), 'min');
let last = ''; for (let g = 0; g < 24 * 60; g += 10) { S.advance(10); const st = (F.transit ? F.transit.ph : 'tactical') + ' | ' + F.status; if (st !== last) { console.log('t+' + (g / 60).toFixed(1) + 'h', st); last = st; } if (!F.transit && /Advancing|objective|Holding|Closing/.test(F.status) && g > 60) break; }
console.log('messages:'); S.log.filter(m => m.who === F.n).slice(-4).forEach(m => console.log('  ', m.txt));

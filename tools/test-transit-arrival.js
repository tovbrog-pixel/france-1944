// A division that arrived by sea, air or road and later forms a road or rail column must stay in the column:
// before the fix of 26 November 2026 the arrival loop landed it again at its first beach the moment the column formed.
//   node tools/test-transit-arrival.js [hours before the test, default 300]
const { createSim } = require('./load-engine')(), sc = require('./scenario-overlord')(1), S = createSim(sc, -1, 3, {}); S.setup();
const H = +(process.argv[2] || 300); for (let g = 0; g < H * 60; g += 30) S.advance(30);
let done = 0, bad = 0;
for (const F of S.forms) { if (done >= 3) break; if (F.s !== 0 || !F.arr || !F.active || F.dead || F.contact || Math.hypot(F.cx - F.x, F.cy - F.y) < 8) continue;
  for (const v of S.vp) { if (v.own !== 0) continue; const d = Math.hypot(v.x - F.cx, v.y - F.cy); if (d < 30 || d > 70) continue; const line = [[v.x - 2, v.y], [v.x + 2, v.y]], plan = S.planMove(F, [], line); if (!plan) continue;
    const x0 = F.cx, y0 = F.cy, n0 = S.log.length; S.issueOrder(F, [], line, {}); if (!F.transit) break; S.advance(60);
    const ashore = S.log.slice(n0).some(l => l.who === F.n && /^Ashore|^Arriving|^On the ground/.test(l.txt)), back = F.subs.filter(u => !u.dead && u.active && Math.hypot(u.x - F.x, u.y - F.y) < 3).length;
    const ok = !ashore && !back && !!F.transit; if (!ok) bad++; done++;
    console.log((ok ? 'PASS ' : 'FAIL ') + F.n + ': column formed at ' + Math.round(x0) + ',' + Math.round(y0) + ', ' + Math.round(Math.hypot(x0 - F.x, y0 - F.y)) + ' km from its landing point, bound for ' + v.n + ' (' + plan.mode + ', ' + Math.round(plan.r.km) + ' km). An hour later: ' + (F.transit ? 'still in the column' : 'no column') + ', landed again: ' + (ashore ? 'yes' : 'no') + ', units back at the landing point: ' + back); break; } }
console.log(done ? (bad ? bad + ' FAILED' : 'all pass') : 'no division could be tested: none found with a road or rail plan'); if (bad || !done) process.exitCode = 1;

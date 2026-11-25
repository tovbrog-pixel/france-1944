// Rail and ambush tests at Falaise, on a copy of the scenario with a test rail line added behind the Allied front.
const { createSim, SCENARIOS, attachTransport } = require('./load-engine')();
const base = SCENARIOS.find(s => s.id === 'falaise');
const sc = Object.assign({}, base, { rails: [[[26, 99], [45, 98], [65, 97], [85, 96], [97, 90], [99, 78]]] });   // about 90 km of track along the Allied rear
function run(label, setup) {
  const S = createSim(sc, 0, 12345, {}); S.setup(); attachTransport(S);
  const F = S.forms.find(f => f.n.startsWith('47th Infantry')), line = setup.line;
  const p = S.planMove(F, [], line); console.log('\n' + label + ': plan', p ? p.mode + ', ' + p.r.km.toFixed(1) + ' km, exit ' + p.rel.x.toFixed(1) + ',' + p.rel.y.toFixed(1) : 'none');
  S.issueOrder(F, [], line, {}); let last = '';
  for (let g = 0; g < 30 * 60; g += 10) { if (setup.at && g === setup.at) setup.fn(S, F); S.advance(10); const st = (F.transit ? F.transit.ph : 'tactical') + ' | ' + F.status; if (st !== last) { console.log('  t+' + (g / 60).toFixed(1) + 'h', st); last = st; } if (!F.transit && g > 120) break; }
  S.log.filter(m => m.who === F.n).slice(-3).forEach(m => console.log('   >', m.txt));
}
run('Rail move', { line: [[94, 84], [100, 84]] });   // the objective lies well behind the front: trains now unload at least 15 km (TRANSPORT.railFrontKm) from enemy-held ground, and the old objective at y 64 put the station at 99,78 inside that limit, so the move went by truck
run('Road move with an enemy unit dropped onto the route', { line: [[24, 68], [30, 68]], at: 120, fn: (S, F) => { const C = F.transit; if (!C) return; const q = polyAtProxy(C); const e = S.subs.find(u => u.s === 1 && u.active && !u.dead && u.cls !== 'hq'); e.x = q[0]; e.y = q[1]; console.log('  (enemy ' + e.n + ' placed ahead of the column head)'); } });
function polyAtProxy(C) { const i = Math.min(C.poly.length - 1, Math.floor(C.poly.length * .6)); return C.poly[i]; }

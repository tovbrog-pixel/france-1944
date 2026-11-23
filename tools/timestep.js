// Time-step experiment: Falaise, 48 game hours, AI vs AI. Compares 1-minute steps (the engine's normal step) with 2- and 5-minute
// steps for speed and for drift in results, against the spread that different random seeds give at 1 minute.
const { createSim, SCENARIOS } = require('./load-engine')();
const sc = SCENARIOS.find(s => s.id === 'falaise');
function run(seed, dt) { const S = createSim(sc, -1, seed, {}); S.setup(); const t = Date.now(); let g = 0; while (!S.over && g < 48 * 60) { S.advance(60, dt); g += 60; }
  return { sec: (Date.now() - t) / 1000, lossA: S.losses[0], lossG: S.losses[1], dead: S.subs.filter(u => u.dead).length, vp: S.score ? S.score().join('-') : '' }; }
const rows = [];
for (const seed of [1, 2, 3]) rows.push(Object.assign({ seed, dt: 1 }, run(seed, 1)));
for (const dt of [2, 5]) rows.push(Object.assign({ seed: 1, dt }, run(1, dt)));
for (const r of rows) console.log(`step ${r.dt} min, seed ${r.seed}: ${r.sec.toFixed(1)} s | losses Allied ${r.lossA.toFixed(1)}, German ${r.lossG.toFixed(1)} | battalions destroyed ${r.dead} | VP ${r.vp}`);

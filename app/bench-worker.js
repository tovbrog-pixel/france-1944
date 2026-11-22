// Runs the real Lines of Advance simulation with no graphics and reports its speed.
importScripts('engine/data.js', 'engine/map.js', 'engine/scenarios.js', 'engine/tutorial.js', 'engine/balance.js',
  'engine/commanders.js', 'engine/guidance.js', 'engine/sim.js', 'engine/assess.js');

onmessage = function (e) {
  const ids = e.data.ids, hours = e.data.hours;
  for (const id of ids) {
    const sc = SCENARIOS.find(s => s.id === id);
    if (!sc) { postMessage({ id, error: 'scenario not found' }); continue; }
    const S = createSim(sc, -1, 12345, {});
    S.setup();
    const t0 = performance.now();
    let g = 0;
    while (!S.over && g < hours * 60) { S.advance(60); g += 60; }
    const sec = (performance.now() - t0) / 1000;
    const units = S.subs.filter(u => u.active && !u.dead).length;
    postMessage({ id, gameHours: g / 60, sec, factor: Math.round(g * 60 / sec), forms: S.forms.length, units });
  }
  postMessage({ done: true });
};

// Stress test at the France game's unit count: the Falaise scenario with every formation's units tripled
// (about 800 units on the same map), run AI-vs-AI for 24 game hours. Optional: node tools/stress.js 3 24
const { createSim, SCENARIOS } = require('./load-engine')();
const mult = +(process.argv[2] || 3), hours = +(process.argv[3] || 24);
const clone = v => Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' && !(v instanceof RegExp) && v.constructor === Object ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v;
const sc = clone(SCENARIOS.find(s => s.id === 'falaise'));
for (const f of sc.forms) { const orig = f.sub.slice(); f.sub = []; for (let k = 0; k < mult; k++) for (const sp of orig) { const a = sp.split('|'); a[1] = (a[1] || a[0]) + (k ? ' (' + (k + 1) + ')' : ''); f.sub.push(a.join('|')); } }
const t0 = Date.now(); const S = createSim(sc, -1, 12345, {}); S.setup(); const tSet = Date.now() - t0;
let g = 0; const t1 = Date.now(); while (!S.over && g < hours * 60) { S.advance(60); g += 60; } const sec = (Date.now() - t1) / 1000;
const units = S.subs.filter(u => u.active && !u.dead).length;
console.log(`Falaise x${mult}: ${S.subs.length} units (${units} active at end), ${g / 60} game h in ${sec.toFixed(1)} s = ${Math.round(g * 60 / sec)}x real time (setup ${tSet} ms)`);

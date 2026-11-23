// Builds a one-page preview of the game on the real map for screenshots or play.
// node tools/build-preview.js [outDir] [normandy|overlord] [side: -1 observer, 0 Allied, 1 German]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'engine', 'src');
const makeNormandy = require('./normandy-test');
const out = process.argv[2] || '/tmp/preview'; fs.mkdirSync(out, { recursive: true });
const which = process.argv[3] || 'normandy', menu = process.argv[4] === 'menu', side = menu ? -1 : +(process.argv[4] == null ? -1 : process.argv[4]);   // 'menu': open on the scenario menu (the desktop app)
const sc = which === 'overlord' || which === 'tutorial-tn' ? require('./scenario-overlord')(1) : makeNormandy(.5);   // the Tennessee tutorial is built into the engine; the page still carries the campaign
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
const keep = ['id', 'title', 'sub', 'modules', 'front', 'detourKm', 'view', 'phaseLines', 'fieldPlan', 'commands', 'cmdPlan', 'brief', 'hist', 'ports', 'beach', 'w', 'h', 'cs', 'realLines', 'rivers', 'roads', 'rails', 'towns', 'ownCell', 'hours', 'start', 'forest', 'rough', 'marsh', 'bridges', 'vp', 'weather', 'forms'];
const D = {}; for (const k of keep) D[k] = sc[k];
if (which !== 'overlord') { D.title = 'Normandy, 25 July 1944 (real-map test)'; D.sub = 'Step 4 data: real terrain, roads, rail, towns and airfields'; D.brief = ['Real-map test.', 'Real-map test.']; }
D.raster = { w: sc.raster.w, h: sc.raster.h, t: b64(sc.raster.t), el: b64(sc.raster.el) };
D.sideOv = sc.sides.map(s => which === 'overlord' ? { name: s.name, rear: s.rear, posture: s.posture, pocket: s.pocket, restH: s.restH, sources: s.sources, pool: s.pool, bases: s.bases, transport: s.transport, groups: s.groups, assets: s.assets } : { rear: s.rear, pocket: undefined, sources: s.sources, bases: s.bases, transport: s.transport });
const inject = `
(function(){ const D = ${JSON.stringify(D)};
  const dec = (s, C) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new C(u.buffer); };
  const base = SCENARIOS.find(s => s.id === 'falaise');
  const sc = Object.assign({}, base, D, { raster: { w: D.raster.w, h: D.raster.h, t: dec(D.raster.t, Uint8Array), el: dec(D.raster.el, Float32Array) },
    sides: base.sides.map((sd, s) => Object.assign({ pocket: undefined }, sd, D.sideOv[s], { assets: D.sideOv[s].assets || sd.assets || [] })),
    front: D.front, thin: undefined, halt: undefined, mines: undefined, sea: undefined, elev: undefined, beach: D.beach });
  delete sc.sideOv; SCENARIOS.unshift(sc); ${menu ? '' : 'window.AUTOSTART = '}${menu ? '' : which === 'tutorial-tn' ? "[SCENARIOS.findIndex(s => s.id === 'tutorial-tn'), 0, 0, 1]" : '[0, ' + side + ', 1, 1]'}${menu ? '' : ';'}
})();
`;
const order = ['data.js', 'divisions.js', 'map.js', 'scenarios.js', 'tutorial.js', 'balance.js', 'commanders.js', 'guidance.js', 'models.js', 'sim.js', 'command.js', 'transport.js', 'air.js', 'assess.js', 'render.js', 'render2.js', 'render3.js', 'sound.js'];
let code = order.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n') + '\n;\n' + inject + '\n;\n' + fs.readFileSync(path.join(src, 'ui.js'), 'utf8');
let html = fs.readFileSync(path.join(src, 'index.tpl.html'), 'utf8');
html = html.replace('<!--THREE-->', '<script>' + fs.readFileSync(path.join(root, 'node_modules', 'three', 'build', 'three.min.js'), 'utf8') + '</script>').replace('/*CODE*/', () => code);
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('preview written: ' + path.join(out, 'index.html') + ' (' + (html.length / 1e6).toFixed(1) + ' MB)');

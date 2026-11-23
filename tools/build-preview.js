// Builds a one-page preview of the game on the real Normandy map (tools/normandy-test.js scenario) for screenshots.
// node tools/build-preview.js [outDir] ; the page opens straight into the scenario as an observer.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'engine', 'src');
const makeNormandy = require('./normandy-test');
const out = process.argv[2] || '/tmp/preview'; fs.mkdirSync(out, { recursive: true });
const sc = makeNormandy(.5);
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
const keep = ['id', 'title', 'w', 'h', 'cs', 'realLines', 'rivers', 'roads', 'rails', 'towns', 'ownCell', 'hours', 'start', 'forest', 'rough', 'marsh', 'bridges', 'vp', 'weather', 'forms'];
const D = {}; for (const k of keep) D[k] = sc[k];
D.title = 'Normandy, 25 July 1944 (real-map test)'; D.sub = 'Step 4 data: real terrain, roads, rail, towns and airfields';
D.raster = { w: sc.raster.w, h: sc.raster.h, t: b64(sc.raster.t), el: b64(sc.raster.el) };
D.sideOv = sc.sides.map(s => ({ rear: s.rear, sources: s.sources, bases: s.bases, transport: s.transport }));
const inject = `
(function(){ const D = ${JSON.stringify(D)};
  const dec = (s, C) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new C(u.buffer); };
  const base = SCENARIOS.find(s => s.id === 'falaise');
  const sc = Object.assign({}, base, D, { raster: { w: D.raster.w, h: D.raster.h, t: dec(D.raster.t, Uint8Array), el: dec(D.raster.el, Float32Array) },
    sides: base.sides.map((sd, s) => Object.assign({}, sd, D.sideOv[s], { pocket: undefined, assets: sd.assets || [] })),
    front: undefined, thin: undefined, halt: undefined, beach: undefined, mines: undefined, sea: undefined, elev: undefined, brief: ['Real-map test.', 'Real-map test.'] });
  delete sc.sideOv; SCENARIOS.unshift(sc); window.AUTOSTART = [0, -1, 1, 1];
})();
`;
const order = ['data.js', 'divisions.js', 'map.js', 'scenarios.js', 'tutorial.js', 'balance.js', 'commanders.js', 'guidance.js', 'models.js', 'sim.js', 'command.js', 'transport.js', 'air.js', 'assess.js', 'render.js', 'render2.js', 'render3.js', 'sound.js'];
let code = order.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n;\n') + '\n;\n' + inject + '\n;\n' + fs.readFileSync(path.join(src, 'ui.js'), 'utf8');
let html = fs.readFileSync(path.join(src, 'index.tpl.html'), 'utf8');
html = html.replace('<!--THREE-->', '<script>' + fs.readFileSync(path.join(root, 'node_modules', 'three', 'build', 'three.min.js'), 'utf8') + '</script>').replace('/*CODE*/', () => code);
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('preview written: ' + path.join(out, 'index.html') + ' (' + (html.length / 1e6).toFixed(1) + ' MB)');

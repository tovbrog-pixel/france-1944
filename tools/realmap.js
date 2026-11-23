// Real terrain for the France engine: reads data/terrain (250 m grids) and data/network, and returns the
// map fields of a scenario (w, h, cs, raster, rivers, roads, rails, towns) for any window of the slice.
// Usage: const realMap = require('./realmap'); Object.assign(sc, realMap({ x0: 200, y0: 150, w: 220, h: 140, cs: 1 }));
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..', 'data');
const T = { OPEN: 0, LF: 1, HF: 2, HILL: 3, MTN: 4, ROUGH: 5, DESERT: 6, JUNGLE: 7, BEACH: 8, MARSH: 9, TOWN: 10, CITY: 11, SEA: 12, RIVER: 13, STREAM: 14, BOCAGE: 15 };

// Classification settings. Each is an inference from the data, open to tuning against the GSGS sheets and the histories.
const REAL = {
  seaFrac: .5,          // share of 250 m sea cells that makes an engine cell sea
  canopyM: 12,          // metres removed per unit of tree cover, since the DSM measures treetops (inference)
  heavyTree: .8,        // tree cover share for heavy forest
  lightTree: .55,       // tree cover share for light forest
  wetFrac: .3,          // herbaceous wetland share for marsh
  waterFrac: .45,       // lake or wide-river share for an impassable water cell
  hillReliefM: 55,      // elevation range inside a 1 km cell that makes it hills
  majorQ: 8,            // HydroRIVERS mean discharge (m3/s) for a river that stops vehicles without a bridge
  streamQ: 2,           // discharge for a stream drawn on the map
  roadClasses: [3, 2],  // OSM-derived classes loaded into the engine (1 = tertiary, left out at 1 km cells)
};

let G = null;
function load() {
  if (G) return G;
  const d = path.join(ROOT, 'terrain'), grid = JSON.parse(fs.readFileSync(path.join(d, 'grid.json'), 'utf8'));
  const rd = (f, Ctor) => { const b = zlib.gunzipSync(fs.readFileSync(path.join(d, f))); return new Ctor(b.buffer, b.byteOffset, b.byteLength / Ctor.BYTES_PER_ELEMENT); };
  G = { grid, el: rd('elev.i16.gz', Int16Array), water: rd('water.u8.gz', Uint8Array), tree: rd('tree.u8.gz', Uint8Array), wet: rd('wet.u8.gz', Uint8Array) };
  const net = path.join(ROOT, 'network'), j = f => fs.existsSync(path.join(net, f)) ? JSON.parse(fs.readFileSync(path.join(net, f), 'utf8')) : null;
  const ovp = path.join(d, 'overlays-1944.json'); G.overlays = fs.existsSync(ovp) ? JSON.parse(fs.readFileSync(ovp, 'utf8')) : null;
  G.roads = j('roads.json'); G.rail = j('rail-1944.json') || j('rail.json');   // the 1944 network when built (tools/data/rail1944.py)
  G.rivers = j('rivers.json'); G.towns = j('towns.json'); G.canals = j('canals.json');
  // 1944 names (data/network/town-names-1944.json, from INSEE's commune history; tools/data/town-names-1944.py); towns.json keeps today's names
  const N44 = j('town-names-1944.json') || {}, byC = N44.byCode || {}, byN = N44.byName || N44.names || {};   // INSEE names by code, then Claude's list
  if (G.towns && G.towns.towns) for (const t of G.towns.towns) { const n = byC[t.insee] || byN[t.name]; if (n && n !== t.name) { t.name_today = t.name_today || t.name; t.name = n; } }
  return G;
}

function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; }

// clip a polyline to the window and shift it to window coordinates; returns pieces with 2+ points
function clipLine(pts, x0, y0, w, h) {
  const out = []; let cur = [];
  const inside = p => p[0] >= x0 && p[0] <= x0 + w && p[1] >= y0 && p[1] <= y0 + h;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (inside(p)) cur.push([+(p[0] - x0).toFixed(2), +(p[1] - y0).toFixed(2)]);
    else { if (cur.length) { if (i > 0) cur.push([Math.max(0, Math.min(w, p[0] - x0)), Math.max(0, Math.min(h, p[1] - y0))]); if (cur.length > 1) out.push(cur); cur = []; }
      else if (i + 1 < pts.length && inside(pts[i + 1])) cur.push([Math.max(0, Math.min(w, p[0] - x0)), Math.max(0, Math.min(h, p[1] - y0))]); }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

function realMap(o) {
  const g = load(), R = g.grid.res / 1000, GW = g.grid.w, GH = g.grid.h, S = Object.assign({}, REAL, o.settings || {});
  const cs = o.cs || 1, x0 = o.x0 || 0, y0 = o.y0 || 0, w = o.w || GW * R - x0, h = o.h || GH * R - y0;
  const W = Math.round(w / cs), H = Math.round(h / cs), N = W * H, k = Math.max(1, Math.round(cs / R));
  const t = new Uint8Array(N), el = new Float32Array(N);
  const ov = o.overlays === false ? {} : (g.overlays || {});
  const bocage = o.bocage || (ov.bocage || []).map(b => b.poly);   // polygons in slice game km where 1944 hedgerow country covered open farmland
  const flood = o.flood || ov.flood || [];                          // June 1944 inundations: low ground inside a box
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const gi0 = Math.floor((x0 + i * cs) / R), gj0 = Math.floor((y0 + j * cs) / R);
    let n = 0, sea = 0, wat = 0, wet = 0, tree = 0, esum = 0, emin = 1e9, emax = -1e9, land = 0;
    for (let dj = 0; dj < k; dj++) for (let di = 0; di < k; di++) {
      const gi = gi0 + di, gj = gj0 + dj; if (gi < 0 || gj < 0 || gi >= GW || gj >= GH) continue;
      const q = gj * GW + gi, wv = g.water[q]; n++;
      if (wv === 1) { sea++; continue; }
      land++; if (wv === 2 || wv === 3) wat++;
      const tr = g.tree[q] / 100, e = g.el[q] - S.canopyM * tr; tree += tr; wet += g.wet[q] / 100; esum += e; if (e < emin) emin = e; if (e > emax) emax = e;
    }
    const c = j * W + i;
    if (!n || sea / n >= S.seaFrac) { t[c] = T.SEA; el[c] = -8; continue; }
    tree /= land; wet /= land; el[c] = Math.max(1, esum / land);
    let tc = T.OPEN;
    if (emax - emin >= S.hillReliefM * Math.sqrt(cs)) tc = T.HILL;   // relief grows with cell size; square root keeps the share steady between 0.5 and 1 km (inference)
    if (tree >= S.heavyTree) tc = T.HF; else if (tree >= S.lightTree) tc = T.LF;
    else if (bocage.length && tc === T.OPEN) { const x = x0 + (i + .5) * cs, y = y0 + (j + .5) * cs; for (const p of bocage) if (inPoly(x, y, p)) { tc = T.BOCAGE; break; } }
    if (wet >= S.wetFrac) tc = T.MARSH;
    if (flood.length) { const x = x0 + (i + .5) * cs, y = y0 + (j + .5) * cs; for (const f of flood) if (x >= f.bbox[0] && x <= f.bbox[2] && y >= f.bbox[1] && y <= f.bbox[3] && el[c] <= f.maxEl) { tc = T.MARSH; break; } }
    if (wat / land >= S.waterFrac) tc = T.RIVER;
    t[c] = tc;
  }
  const out = { w: W * cs, h: H * cs, cs, realLines: true, raster: { w: W, h: H, t, el }, rivers: [], roads: [], rails: [], towns: [], sea: undefined, elev: undefined };
  if (g.rivers) for (const r of g.rivers.rivers) { if (r.q < S.streamQ) continue; for (const p of clipLine(r.pts, x0, y0, w, h)) out.rivers.push([r.name || '', r.q >= S.majorQ ? 1 : 2, p]); }
  if (g.roads) for (const c of S.roadClasses) for (const l of g.roads.classes[String(c)] || []) for (const p of clipLine(l, x0, y0, w, h)) out.roads.push([c, p]);
  if (g.rail) for (const l of g.rail.lines) { if (l.usage === 'narrow') continue; for (const p of clipLine(l.pts, x0, y0, w, h)) out.rails.push(p); }
  if (g.towns) for (const tw of g.towns.towns) if (tw.x >= x0 && tw.x <= x0 + w && tw.y >= y0 && tw.y <= y0 + h) out.towns.push([tw.name, +(tw.x - x0).toFixed(2), +(tw.y - y0).toFixed(2), tw.size]);
  return out;
}
realMap.load = load; realMap.REAL = REAL; realMap.T = T;
module.exports = realMap;

if (require.main === module) {
  const t0 = Date.now(), m = realMap({ cs: +(process.argv[2] || 1) });
  if (process.argv[3]) { // write a PPM picture of a window: node tools/realmap.js 0.5 out.ppm x0 y0 w h
    const [x0, y0, w, h] = process.argv.slice(4, 8).map(Number), cs = +(process.argv[2] || 1), q = realMap({ cs, x0, y0, w, h });
    const COL = { 0: [222, 226, 190], 1: [150, 190, 120], 2: [90, 140, 80], 3: [200, 180, 140], 9: [110, 170, 190], 12: [140, 180, 220], 13: [40, 80, 200], 14: [80, 120, 220], 15: [190, 205, 140] };
    const W = q.raster.w, H = q.raster.h, buf = Buffer.alloc(W * H * 3);
    for (let c = 0; c < W * H; c++) { const k = COL[q.raster.t[c]] || [255, 0, 255], sh = q.raster.t[c] === 12 ? 1 : Math.min(1.1, .8 + q.raster.el[c] / 900); buf[c * 3] = k[0] * sh; buf[c * 3 + 1] = k[1] * sh; buf[c * 3 + 2] = k[2] * sh; }
    const mark = (x, y, col) => { const i = Math.round(x / cs), j = Math.round(y / cs); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < W && jj < H) { const o = (jj * W + ii) * 3; buf[o] = col[0]; buf[o + 1] = col[1]; buf[o + 2] = col[2]; } } };
    for (const r of q.roads) for (const p of r[1]) mark(p[0], p[1], r[0] === 3 ? [200, 30, 30] : [230, 120, 40]);
    for (const l of q.rails) for (const p of l) mark(p[0], p[1], [20, 20, 20]);
    for (const tw of q.towns) mark(tw[1], tw[2], [120, 0, 120]);
    fs.writeFileSync(process.argv[3], Buffer.concat([Buffer.from('P6 ' + W + ' ' + H + ' 255\n'), buf]));
  }
  const hist = {}; for (const v of m.raster.t) hist[v] = (hist[v] || 0) + 1;
  const names = Object.fromEntries(Object.entries(T).map(([a, b]) => [b, a]));
  console.log('slice ' + m.w + ' x ' + m.h + ' km at ' + m.cs + ' km: ' + Object.entries(hist).map(([a, b]) => names[a] + ' ' + b).join(', '));
  console.log('rivers ' + m.rivers.length + ', roads ' + m.roads.length + ', rail ' + m.rails.length + ', towns ' + m.towns.length + '; ' + (Date.now() - t0) + ' ms');
}

// Air layer for a window and date: airfields open on that date (Allied: opened on or before it; German: held after it)
// and troop carrier fleets from data/air. Returns { bases: [allied[], german[]], transport: [alliedAircraft, germanAircraft] }.
realMap.airAt = function (date, o) {
  const p = path.join(ROOT, 'air'), A = JSON.parse(fs.readFileSync(path.join(p, 'airfields-1944.json'), 'utf8')), F = JSON.parse(fs.readFileSync(path.join(p, 'fleet-1944.json'), 'utf8'));
  const x0 = o.x0 || 0, y0 = o.y0 || 0, w = o.w || 820, h = o.h || 450, inWin = q => q.xy[0] >= x0 && q.xy[0] <= x0 + w && q.xy[1] >= y0 && q.xy[1] <= y0 + h;
  const base = (q, s) => ({ s, n: q.code + ' ' + q.name, x: +(q.xy[0] - x0).toFixed(2), y: +(q.xy[1] - y0).toFixed(2), kind: 'field', hist: q.code });
  const allied = A.fields.filter(q => q.open && q.open <= date && inWin(q)).map(q => base(q, 0));
  const german = A.german.filter(q => (!q.heldUntil || q.heldUntil > date) && inWin(q)).map(q => base(q, 1));
  const tA = F.allied.transport.find(t => t.date <= date && t.aircraft === 1360), tG = F.german.strength.find(t => t.transport);
  return { bases: [allied, german], transport: [tA ? tA.aircraft : 0, tG ? tG.transport[1] : 0] };
};

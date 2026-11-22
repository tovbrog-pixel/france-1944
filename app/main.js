// France 1944 technical test: tiled 3D map, moving placeholder divisions, frame-rate readout,
// and a speed test of the real Lines of Advance engine running in a background worker.
'use strict';
(function () {
  const W = 220, H = 140;                 // map extent in km: x east, y north
  const TILE = 20, NX = Math.ceil(W / TILE), NY = Math.ceil(H / TILE);
  const VEX = 6;                           // vertical exaggeration; Normandy relief is low
  const KM = m => m / 1000 * VEX;          // metres of elevation to scene units (km)

  // ---------- placeholder terrain shaped like Normandy ----------
  function hash(i, j) { let h = i * 374761393 + j * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }
  function fbm(x, y) { let s = 0, a = .5, f = 1; for (let k = 0; k < 5; k++) { s += a * vnoise(x * f, y * f); a *= .5; f *= 2.03; } return s; }
  const bump = (x, y, cx, cy, r) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (r * r));
  function seaAt(x, y) {
    if (x > 52 && y > 92 + 2.5 * Math.sin(x / 9) - (x > 160 && x < 195 ? 12 * bump(x, 0, 177, 0, 9) : 0)) return true; // Bay of the Seine, Seine estuary
    if (y > 58 && x < 7 + 4 * Math.sin(y / 7)) return true;                                                           // west coast of the Cotentin
    if (y > 132 && x < 52) return true;                                                                               // Channel north of Cherbourg
    return false;
  }
  function elevM(x, y) {   // elevation in metres
    if (seaAt(x, y)) return -25;
    let h = 12 + 95 * fbm(x / 22, y / 22) + 260 * bump(x, y, 88, 30, 22) + 200 * bump(x, y, 45, 22, 20) + 120 * bump(x, y, 150, 18, 30);
    let c = 1; for (const [dx, dy] of [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]]) if (seaAt(x + dx, y + dy)) c -= .22;
    return Math.max(2, h * c);
  }
  const groundKm = (x, y) => KM(Math.max(0, elevM(x, y)));

  // ---------- renderer and scene ----------
  const view = document.getElementById('view');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(view.clientWidth, view.clientHeight);
  view.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb6c8);
  scene.fog = new THREE.Fog(0x9fb6c8, 220, 520);
  const camera = new THREE.PerspectiveCamera(50, view.clientWidth / view.clientHeight, 0.2, 1200);
  scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x4a5236, 0.75));
  const sun = new THREE.DirectionalLight(0xfff2dc, 0.75); sun.position.set(-80, 120, 60); scene.add(sun);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(W + 200, H + 200), new THREE.MeshLambertMaterial({ color: 0x3d6378 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(W / 2, -0.01, -H / 2); scene.add(sea);

  // ---------- tiled terrain with level of detail ----------
  const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const tiles = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) tiles.push({ i, j, res: 0, want: 0, mesh: null });
  const colLow = new THREE.Color(0x6f8f4a), colMid = new THREE.Color(0x58743c), colHigh = new THREE.Color(0x8a7a52), colSea = new THREE.Color(0x30505f), tmp = new THREE.Color();
  function buildTile(t, res) {
    const x0 = t.i * TILE, y0 = t.j * TILE, n = res + 1;
    const pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), idx = [];
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) {
      const x = x0 + TILE * a / res, y = y0 + TILE * b / res, e = elevM(x, y), k = (b * n + a) * 3;
      pos[k] = x; pos[k + 1] = KM(e); pos[k + 2] = -y;
      if (e < 0) tmp.copy(colSea); else if (e < 90) tmp.copy(colLow).lerp(colMid, e / 90); else tmp.copy(colMid).lerp(colHigh, Math.min(1, (e - 90) / 220));
      const v = .92 + .16 * vnoise(x * 1.7, y * 1.7); col[k] = tmp.r * v; col[k + 1] = tmp.g * v; col[k + 2] = tmp.b * v;
    }
    for (let b = 0; b < res; b++) for (let a = 0; a < res; a++) { const p = b * n + a; idx.push(p, p + 1, p + n, p + 1, p + n + 1, p + n); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    if (t.mesh) { t.mesh.geometry.dispose(); t.mesh.geometry = g; } else { t.mesh = new THREE.Mesh(g, terrainMat); scene.add(t.mesh); }
    t.res = res; stats.tileBuilds++;
  }
  function updateTileWants() {
    for (const t of tiles) {
      const cx = (t.i + .5) * TILE, cy = (t.j + .5) * TILE, d = Math.hypot(camera.position.x - cx, -camera.position.z - cy, camera.position.y);
      t.want = d < 40 ? 64 : d < 90 ? 32 : d < 170 ? 16 : 8;
    }
  }
  function buildSomeTiles(budget) {
    const todo = tiles.filter(t => t.want !== t.res).sort((a, b) => b.want - a.want);
    for (let k = 0; k < Math.min(budget, todo.length); k++) buildTile(todo[k], todo[k].want);
  }

  // ---------- placeholder divisions, units and vehicles ----------
  const MAXDIV = 300, SUBS = 4, VEH = 8;
  let rs = 1944; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  function landPoint(side) { for (;;) { const x = 10 + rnd() * (W - 20), y = side === 0 ? 55 + rnd() * 35 : 8 + rnd() * 55; if (!seaAt(x, y) && !seaAt(x + 3, y + 3)) return [x, y]; } }
  const divs = [];
  function addDivisions(count) {
    for (let k = 0; k < count && divs.length < MAXDIV; k++) {
      const side = divs.length % 3 === 2 ? 1 : 0, p = landPoint(side), q = landPoint(side);
      divs.push({ side, x: p[0], y: p[1], tx: q[0], ty: q[1], spd: .04 + rnd() * .08, hx: 1, hy: 0, trail: [] });
    }
  }
  addDivisions(150);
  const subGeo = new THREE.BoxGeometry(1.4, .35, .8), vehGeo = new THREE.BoxGeometry(.22, .12, .12);
  const subMesh = new THREE.InstancedMesh(subGeo, new THREE.MeshLambertMaterial(), MAXDIV * SUBS);
  const vehMesh = new THREE.InstancedMesh(vehGeo, new THREE.MeshLambertMaterial(), MAXDIV * VEH);
  const symTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 80; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(6, 6, 116, 68); g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(6, 6, 116, 68);
    g.beginPath(); g.moveTo(6, 6); g.lineTo(122, 74); g.moveTo(122, 6); g.lineTo(6, 74); g.stroke(); g.fillStyle = '#111'; g.fillRect(52, 0, 6, 6); g.fillRect(70, 0, 6, 6); return new THREE.CanvasTexture(c); })();
  const symMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshBasicMaterial({ map: symTex, transparent: true, depthWrite: false }), MAXDIV);
  scene.add(subMesh, vehMesh, symMesh);
  const allied = new THREE.Color(0x6b7f3a), german = new THREE.Color(0x6c6f74), symA = new THREE.Color(0x8fb4e8), symG = new THREE.Color(0xe89a8f);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), E = new THREE.Euler();
  function colorInstances() {
    for (let d = 0; d < divs.length; d++) {
      const c = divs[d].side ? german : allied; for (let s = 0; s < SUBS; s++) subMesh.setColorAt(d * SUBS + s, c);
      for (let v = 0; v < VEH; v++) vehMesh.setColorAt(d * VEH + v, c); symMesh.setColorAt(d, divs[d].side ? symG : symA);
    }
    [subMesh, vehMesh, symMesh].forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  colorInstances();
  const OFF = [[0, 1.6], [-1.8, -.3], [1.8, -.3], [0, -2.2]];   // three manoeuvre units and a support group, in division-local km
  function stepDivisions(dt) {
    for (const D of divs) {
      let dx = D.tx - D.x, dy = D.ty - D.y, d = Math.hypot(dx, dy);
      if (d < 1) { const q = landPoint(D.side); D.tx = q[0]; D.ty = q[1]; continue; }
      const sx = D.x + dx / d * D.spd * dt * 10, sy = D.y + dy / d * D.spd * dt * 10;
      if (seaAt(sx, sy)) { const q = landPoint(D.side); D.tx = q[0]; D.ty = q[1]; continue; }
      D.hx += (dx / d - D.hx) * .05; D.hy += (dy / d - D.hy) * .05; const hl = Math.hypot(D.hx, D.hy) || 1; D.hx /= hl; D.hy /= hl;
      D.x = sx; D.y = sy; D.trail.unshift([D.x, D.y]); if (D.trail.length > 90) D.trail.pop();
    }
  }
  function placeInstances(near, far, camH) {
    subMesh.count = near ? divs.length * SUBS : 0; vehMesh.count = near ? divs.length * VEH : 0; symMesh.count = far ? divs.length : 0;
    for (let d = 0; d < divs.length; d++) {
      const D = divs[d], ang = Math.atan2(D.hy, D.hx), cs = Math.cos(ang - Math.PI / 2), sn = Math.sin(ang - Math.PI / 2);
      if (near) {
        for (let s = 0; s < SUBS; s++) {
          const ox = OFF[s][0] * cs - OFF[s][1] * sn, oy = OFF[s][0] * sn + OFF[s][1] * cs, x = D.x + ox, y = D.y + oy;
          E.set(0, ang, 0); Q.setFromEuler(E); V.set(x, groundKm(x, y) + .2, -y); M.compose(V, Q, Sc); subMesh.setMatrixAt(d * SUBS + s, M);
        }
        for (let v = 0; v < VEH; v++) {
          const p = D.trail[Math.min(D.trail.length - 1, 10 + v * 9)] || [D.x, D.y];
          V.set(p[0], groundKm(p[0], p[1]) + .08, -p[1]); Q.identity(); M.compose(V, Q, Sc); vehMesh.setMatrixAt(d * VEH + v, M);
        }
      }
      if (far) {
        const s = Math.max(1, camH / 30); Sc.set(s, s, s); Q.copy(camera.quaternion); V.set(D.x, groundKm(D.x, D.y) + 1.2 * s, -D.y);
        M.compose(V, Q, Sc); symMesh.setMatrixAt(d, M); Sc.set(1, 1, 1);
      }
    }
    subMesh.instanceMatrix.needsUpdate = true; vehMesh.instanceMatrix.needsUpdate = true; symMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- camera: pan, rotate, tilt, zoom; never at ground level ----------
  const cam = { x: 110, y: 70, dist: 150, yaw: 0, pitch: 1.0 };
  { const q = new URLSearchParams(location.search); for (const k of ['x', 'y', 'dist', 'yaw', 'pitch']) if (q.has(k)) cam[k] = +q.get(k); }
  function placeCamera() {
    cam.pitch = Math.min(1.48, Math.max(.42, cam.pitch)); cam.dist = Math.min(320, Math.max(4, cam.dist));
    cam.x = Math.min(W, Math.max(0, cam.x)); cam.y = Math.min(H, Math.max(0, cam.y));
    const gy = groundKm(cam.x, cam.y), r = cam.dist * Math.cos(cam.pitch);
    camera.position.set(cam.x - r * Math.sin(cam.yaw), gy + cam.dist * Math.sin(cam.pitch), -cam.y + r * Math.cos(cam.yaw));
    const below = groundKm(camera.position.x, -camera.position.z) + 1; if (camera.position.y < below) camera.position.y = below;
    camera.lookAt(cam.x, gy, -cam.y);
  }
  let drag = 0, lx = 0, ly = 0;
  renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
  renderer.domElement.addEventListener('mousedown', e => { drag = e.button === 2 ? 2 : 1; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('mouseup', () => { drag = 0; });
  window.addEventListener('mousemove', e => {
    if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    if (drag === 1) { const k = cam.dist / 600, c = Math.cos(cam.yaw), s = Math.sin(cam.yaw); cam.x -= (dx * c + dy * s) * k; cam.y += (dy * c - dx * s) * k; }
    else { cam.yaw -= dx * .005; cam.pitch += dy * .004; }
  });
  renderer.domElement.addEventListener('wheel', e => { e.preventDefault(); cam.dist *= Math.exp(e.deltaY * .0012); }, { passive: false });
  window.addEventListener('resize', () => { renderer.setSize(view.clientWidth, view.clientHeight); camera.aspect = view.clientWidth / view.clientHeight; camera.updateProjectionMatrix(); });

  // ---------- readouts ----------
  const stats = { frames: [], tileBuilds: 0 };
  const $ = id => document.getElementById(id);
  const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpuName = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'not reported';
  $('gpu').textContent = gpuName; $('gpu').title = gpuName;
  let last = performance.now(), lastLod = 0, lastHud = 0, fpsTxt = '-', lowTxt = '-';
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    stats.frames.push(dt * 1000); if (stats.frames.length > 600) stats.frames.shift();
    placeCamera();
    if (now - lastLod > 400) { updateTileWants(); lastLod = now; }
    buildSomeTiles(2);
    stepDivisions(dt);
    const camH = camera.position.y - groundKm(cam.x, cam.y), near = cam.dist < 90, far = cam.dist > 45;
    placeInstances(near, far, camH);
    renderer.render(scene, camera);
    if (now - lastHud > 500) {
      lastHud = now; const f = stats.frames.slice().sort((a, b) => a - b), avg = f.reduce((a, b) => a + b, 0) / f.length, p99 = f[Math.floor(f.length * .99)] || avg;
      fpsTxt = (1000 / avg).toFixed(0) + ' fps'; lowTxt = (1000 / p99).toFixed(0) + ' fps';
      $('fps').textContent = fpsTxt; $('low').textContent = lowTxt;
      $('draw').textContent = renderer.info.render.calls + ' / ' + (renderer.info.render.triangles / 1000).toFixed(0) + 'k';
      $('tiles').textContent = tiles.filter(t => t.res).length + ' of ' + tiles.length + ' (' + stats.tileBuilds + ' builds)';
      $('units').textContent = divs.length + ' / ' + divs.length * SUBS + ' / ' + divs.length * VEH;
      $('cam').textContent = camH.toFixed(1) + ' km';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- buttons ----------
  const benchLines = [];
  $('btnBench').onclick = () => {
    $('btnBench').disabled = true; benchLines.length = 0; benchLines.push('Engine speed test (AI vs AI, no graphics):'); $('bench').textContent = benchLines.join('\n') + '\nrunning...';
    const w = new Worker('bench-worker.js');
    w.onmessage = e => {
      const r = e.data;
      if (r.done) { $('btnBench').disabled = false; $('bench').textContent = benchLines.join('\n'); w.terminate(); return; }
      benchLines.push(r.error ? r.id + ': ' + r.error : r.id + ': ' + r.units + ' units, ' + r.gameHours + ' game h in ' + r.sec.toFixed(1) + ' s = ' + r.factor.toLocaleString() + 'x real time');
      $('bench').textContent = benchLines.join('\n') + '\nrunning...';
    };
    w.onerror = e => { benchLines.push('worker error: ' + e.message); $('bench').textContent = benchLines.join('\n'); $('btnBench').disabled = false; };
    w.postMessage({ ids: ['kasserine', 'falaise'], hours: 48 });
  };
  $('btnDouble').onclick = () => { addDivisions(150); colorInstances(); $('btnDouble').disabled = divs.length >= MAXDIV; };
  $('btnCopy').onclick = () => {
    const txt = ['France 1944 technical test report', 'Graphics card: ' + gpuName, 'Frame rate: ' + fpsTxt + ' (slowest 1%: ' + lowTxt + ')',
      'Divisions: ' + divs.length + ', camera distance ' + cam.dist.toFixed(0) + ' km', 'Window: ' + view.clientWidth + ' x ' + view.clientHeight].concat(benchLines).join('\n');
    const done = () => { $('btnCopy').textContent = 'Copied'; setTimeout(() => { $('btnCopy').textContent = 'Copy report'; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done)); else fallbackCopy(txt, done);
  };
  function fallbackCopy(txt, done) { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
})();

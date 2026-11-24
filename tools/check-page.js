#!/usr/bin/env node
// Checks the single-file game page the way a player meets it: opens it in headless Chrome, starts Overlord as the Allies, plays 30 game
// hours and confirms that every module the scenario asks for is alive in the page. Written after a page went out without the German
// commander and replacements while the simulation tests passed.
//   node tools/check-page.js [outDir]        (needs puppeteer-core and Google Chrome; set CHROME to the browser's path if it is elsewhere)
// Exit code 0 when every check passes.
const path = require('path'), fs = require('fs'), cp = require('child_process');
let puppeteer; try { puppeteer = require('puppeteer-core'); } catch (e) { console.error('puppeteer-core is not installed: npm install --no-save puppeteer-core'); process.exit(2); }
const out = path.resolve(process.argv[2] || '/tmp/check-page'), chrome = process.env.CHROME || '/usr/bin/google-chrome';
(async () => {
  cp.execFileSync('node', [path.join(__dirname, 'build-preview.js'), out + '/menu', 'overlord', 'menu'], { stdio: 'ignore' });
  cp.execFileSync('node', [path.join(__dirname, 'build-preview.js'), out + '/game', 'overlord', '0'], { stdio: 'ignore' });
  const sc = require('./scenario-overlord')(1), fails = [], ok = (name, pass, got) => { console.log((pass ? 'ok    ' : 'FAIL  ') + name + (got != null ? ': ' + got : '')); if (!pass) fails.push(name); };
  const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', protocolTimeout: 600000, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=1600,1000'] });
  const errs = [];
  let p = await b.newPage(); p.on('pageerror', e => errs.push('menu: ' + e.message)); await p.goto('file://' + out + '/menu/index.html', { waitUntil: 'load', timeout: 180000 }); await new Promise(r => setTimeout(r, 6000));
  const seats = await p.evaluate(() => [...document.querySelectorAll('[data-side]')].map(e => +e.dataset.side));
  ok('menu offers the seats in playerSides', JSON.stringify(seats) === JSON.stringify(sc.playerSides || [0, 1, -1]), JSON.stringify(seats)); await p.close();
  p = await b.newPage(); p.on('pageerror', e => errs.push('game: ' + e.message)); await p.goto('file://' + out + '/game/index.html', { waitUntil: 'load', timeout: 180000 }); await new Promise(r => setTimeout(r, 12000));
  const g = await p.evaluate(() => { const S = window.GAME.S; window.GAME.setSpeed && window.GAME.setSpeed(0); for (let t = 0; t < 30 * 60; t += 30) S.advance(30);
    return { keys: Object.keys(S.sc), modules: S.sc.modules, theater: S.theater ? S.theater.log.length : null, pools: S.repl ? S.repl.pools.length : null, commands: (S.commands || []).length, pol: S.pol != null || S.polComposite != null, columns: typeof S.columnView, mobile: typeof S.isMobile, towns: S.vp.filter(v => v.cells).length, flights: Array.isArray(S.flights), clock: S.clock(S.t) }; });
  for (const k of Object.keys(sc)) if (!['thin', 'halt', 'elev', 'sides', 'raster', 'sea', 'mines', 'buildLog'].includes(k)) ok('page carries setting ' + k, g.keys.includes(k));
  ok('modules listed', JSON.stringify(g.modules) === JSON.stringify(sc.modules), (g.modules || []).join(','));
  const alive = { transport: g.columns === 'function', air: g.flights, command: g.commands > 0, politics: g.pol, theater: g.theater != null && g.theater > 0, repl: g.pools > 0, doctrine: g.mobile === 'function', urban: g.towns > 0 };
  for (const m of sc.modules) if (!(m in alive)) ok('the checker knows module ' + m, false);
  for (const m of sc.modules) ok('module ' + m + ' is alive after 30 game hours', !!alive[m]);
  ok('no page errors', !errs.length, errs.join(' | ') || 'none');
  await b.close(); console.log(fails.length ? fails.length + ' check(s) failed' : 'All checks passed (' + g.clock + ')'); process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });

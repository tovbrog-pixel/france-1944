// ===== THEATER COMMANDER: the computer side's high command =====
// A scenario gives the side a default plan (sc.theater.plan: which division goes to which sector, and when) and the commander
// carries it out while the battle runs near that plan. He departs from it when the battle does:
//   1. An arriving division goes to the sector under the heaviest pressure near its planned one, when that pressure is clearly worse.
//   2. A mobile division whose planned sector is quiet waits in reserve behind it and is committed where the front needs it.
//   3. A mobile division in a quiet sector moves to a sector in crisis when no reserve is left.
//   4. A division with the enemy behind it steps back and re-forms its line.
//   5. When the enemy stands deep behind the front, the line is turned. After the delay the high command imposes (okwDelayH),
//      every holding division is ordered back to the fallback line.
// He acts only on the side the computer plays. Every threshold below is a game setting for balance testing.
const THEATER = {
  tickH: 6,
  nearE: 12, nearF: 9,          // km around a sector point in which enemy and friendly battalions count
  pad: 8,                       // battalions added to the friendly count, so an empty sector does not divide by zero
  rerouteKm: 40,                // an arriving division may be sent to a sector this far from its planned one
  rerouteNeed: 3, rerouteGain: 2, homeCalm: 1,   // the other sector must be this pressed and this many times worse than the planned one, and the planned one must be calmer than homeCalm
  quiet: .3,                    // a planned sector under this pressure is quiet: a mobile division waits in reserve
  maxReserve: 2, reserveBack: 14,       // divisions held in reserve at once; km behind the sector they wait
  commitNeed: 1, commitKm: 70,        // a reserve is committed to a sector at least this pressed, within this distance
  crisis: 3, lendE: 3, lendKm: 40, lendStr: .6, lendCoolH: 120,   // transfers between sectors: only from a sector with fewer than lendE enemy battalions near it
  flankKm: 12, flankR: 6, flankBn: 5, stepKm: 10, stepCoolH: 48,   // enemy behind a division: where to look, how many battalions, how far to step back
  turnKm: 35, turnBn: 8, frontKm: 30,   // the line is turned when this many enemy battalions stand this far beyond the front
  okwDelayH: 384                // hours between the line being turned and the general withdrawal
};
function attachTheater(S) {
  const sc = S.sc, T = sc.theater; if (!T) return S;
  const cfg = Object.assign({}, THEATER, T.set || {}), s = T.s, es = 1 - s, who = T.n || 'Theater command';
  const st = { res: [], log: [], turnedAt: null, withdrawn: false, moves: 0 }; S.theater = st;
  const fByN = {}; for (const F of S.forms) if (F.s === s) fByN[F.n] = F;
  const plan = (T.plan || []).map(q => ({ F: fByN[q.f], sec: q.sec, t: q.t, done: false })).filter(q => q.F && T.sectors[q.sec]).sort((a, b) => a.t - b.t);
  // divisions the scenario told to hold: the commander now decides when that ends
  for (const F of S.forms) if (F.s === s && F.stay && F.stayUntil) { F.stayUntil = 1e9; F.thHeld = true; }
  for (const q of plan) q.F.thPlan = q.sec;
  const fights = u => u.active && !u.dead && u.cls !== 'hq' && u.mv !== 'ship';
  function count(side, x, y, r, skip) { let n = 0; for (const u of S.subs) if (u.s === side && fights(u) && u.f !== skip && Math.hypot(u.x - x, u.y - y) < r) n += u.str; return n; }
  function need(key, skip) { const p = T.sectors[key].p; return count(es, p[0], p[1], cfg.nearE) / (count(s, p[0], p[1], cfg.nearF, skip) + cfg.pad); }
  const mobile = F => F.subs.filter(u => !u.dead && (u.mv === 'track' || u.mv === 'wheel' || u.mv === 'half')).length * 2 > F.subs.filter(u => !u.dead).length;
  const centre = F => { let x = 0, y = 0, n = 0; for (const u of F.subs) if (fights(u)) { x += u.x; y += u.y; n++; } return n ? [x / n, y / n] : [F.cx || 0, F.cy || 0]; };
  function note(txt, lvl) { st.log.push({ t: S.t, txt }); S.say(s, who + ': ' + txt, lvl || 1); }
  function hold(F, key, line) { const sec = T.sectors[key]; F.thSec = key; F.thLine = line || sec.line; F.thBack = sec.back; F.thRes = false; if (F.thMin != null) { F.stayMinStr = F.thMin; F.thMin = null; } F.stay = true; F.stayUntil = 1e9; F.thHeld = true; F.thMoveT = S.t;
    S.issueOrder(F, [], F.thLine, { free: true, stretch: true, then: 'dig' }); }
  function reserve(F, key) { const sec = T.sectors[key], b = sec.back, c = [sec.p[0] + b[0] * cfg.reserveBack, sec.p[1] + b[1] * cfg.reserveBack];
    F.thSec = null; F.thRes = true; F.thHome = key; F.thMin = F.stayMinStr || 0; F.stayMinStr = 0; F.stay = true;   // a division still assembling in reserve is not judged worn out
    F.stayUntil = 1e9; F.thHeld = true; F.thMoveT = S.t; st.res.push(F);
    S.issueOrder(F, [], [[c[0] - b[1] * 3, c[1] + b[0] * 3], [c[0] + b[1] * 3, c[1] - b[0] * 3]], { free: true, then: 'reserve' }); }
  function commitArrival(q) { const F = q.F, home = q.sec, hp = T.sectors[home].p, n0 = need(home, F); let best = home, bn = n0;
    for (const k in T.sectors) { if (k === home) continue; const p = T.sectors[k].p; if (Math.hypot(p[0] - hp[0], p[1] - hp[1]) > cfg.rerouteKm) continue; const n = need(k, F); if (n > bn) { bn = n; best = k; } }
    if (best !== home && n0 < cfg.homeCalm && bn >= cfg.rerouteNeed && bn > cfg.rerouteGain * n0 + .3) { hold(F, best); st.moves++; note(F.n + ' goes to the ' + T.sectors[best].n + ' sector, where the front is hardest pressed, in place of ' + T.sectors[home].n + '.'); return; }
    st.res = st.res.filter(G => !G.dead && G.thRes);
    if (n0 < cfg.quiet && mobile(F) && st.res.length < cfg.maxReserve) { reserve(F, home); note(F.n + ' waits in reserve behind the ' + T.sectors[home].n + ' sector.', 0); return; }
    hold(F, home); }
  function tick() {
    const live = S.forms.filter(F => F.s === s && F.active && !F.dead && F.thHeld && F.stay);
    // reserves: commit where the front needs them
    st.res = st.res.filter(G => !G.dead && G.thRes && G.stay);   // a division on a road or rail move is inactive for the moment and stays on the list
    for (const F of st.res.slice()) { if (!F.active) continue; const c = centre(F); let best = null, bn = cfg.commitNeed;
      for (const k in T.sectors) { const p = T.sectors[k].p; if (Math.hypot(p[0] - c[0], p[1] - c[1]) > cfg.commitKm) continue; const n = need(k, F); if (n >= bn) { bn = n; best = k; } }
      if (!best && need(F.thHome, F) >= cfg.quiet * 2) best = F.thHome;
      if (best) { st.res = st.res.filter(G => G !== F); hold(F, best); st.moves++; note(F.n + ' is committed from reserve to the ' + T.sectors[best].n + ' sector.'); } }
    // a sector in crisis and no reserve: lend a mobile division from a quiet sector
    if (!st.res.length) { let worst = null, wn = cfg.crisis; for (const k in T.sectors) { const n = need(k); if (n >= wn) { wn = n; worst = k; } }
      if (worst) { const wp = T.sectors[worst].p; let pick = null, pd = cfg.lendKm;
        for (const F of live) { if (!F.thSec || F.thSec === worst || !mobile(F) || S.strength(F) < cfg.lendStr || S.t - (F.thMoveT || 0) < cfg.lendCoolH * 60 || count(es, T.sectors[F.thSec].p[0], T.sectors[F.thSec].p[1], cfg.nearE) >= cfg.lendE) continue; const c = centre(F), d = Math.hypot(c[0] - wp[0], c[1] - wp[1]); if (d < pd) { pd = d; pick = F; } }
        if (pick) { const from = T.sectors[pick.thSec].n; hold(pick, worst); st.moves++; note(pick.n + ' leaves the quiet ' + from + ' sector for ' + T.sectors[worst].n + '.'); } } }
    // enemy behind a division: step back and re-form
    for (const F of live) { if (!F.thSec || !F.thLine || S.t - (F.thMoveT || 0) < cfg.stepCoolH * 60) continue; const c = centre(F), b = F.thBack, L = F.thLine, m = [(L[0][0] + L[1][0]) / 2, (L[0][1] + L[1][1]) / 2];
      if (Math.hypot(c[0] - m[0], c[1] - m[1]) > 12) continue;   // still on the march to its line
      const rx = c[0] + b[0] * cfg.flankKm, ry = c[1] + b[1] * cfg.flankKm, eb = count(es, rx, ry, cfg.flankR); if (eb < cfg.flankBn || eb < 2 * count(s, rx, ry, cfg.flankR, F)) continue;   // the enemy must outweigh our own troops there
      const nl = L.map(p => [Math.max(1, Math.min(S.map.w - 1, p[0] + b[0] * cfg.stepKm)), Math.max(1, Math.min(S.map.h - 1, p[1] + b[1] * cfg.stepKm))]);
      hold(F, F.thSec, nl); st.moves++; note(F.n + ' has the enemy behind it and steps back ' + cfg.stepKm + ' km.'); }
    // the front as a whole
    if (st.turnedAt == null && T.base && T.rear) { const ux = T.rear[0] - T.base[0], uy = T.rear[1] - T.base[1], ul = Math.hypot(ux, uy) || 1, dep = (x, y) => ((x - T.base[0]) * ux + (y - T.base[1]) * uy) / ul;
      const D = live.filter(F => F.thSec).map(F => centre(F)).filter(c => count(es, c[0], c[1], cfg.frontKm) > 0).map(c => dep(c[0], c[1])).sort((a, b) => a - b);
      if (D.length >= 3) { const dG = D[Math.floor(D.length / 2)]; let n = 0; for (const u of S.subs) if (u.s === es && fights(u) && dep(u.x, u.y) > dG + cfg.turnKm) n += u.str;
        if (n >= cfg.turnBn) { st.turnedAt = S.t; note('The enemy is behind the front in strength. The line is turned. The high command still forbids a withdrawal.', 2); } } }
    if (st.turnedAt != null && !st.withdrawn && S.t >= st.turnedAt + cfg.okwDelayH * 60) { st.withdrawn = true; note('General withdrawal ordered' + (T.backN ? ' to ' + T.backN : '') + '.', 2);
      for (const F of S.forms) { if (F.s !== s || !F.thHeld || !F.stay || !F.active || F.dead) continue; F.stay = false; F.stayUntil = 0; F.thRes = false; F.thSec = null;
        if (T.back && T.back.length > 1) { const c = centre(F); let bp = null, bd = 1e9;   // nearest point of the fallback line
            for (let i = 1; i < T.back.length; i++) { const a = T.back[i - 1], b = T.back[i], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / l2)), p = [a[0] + dx * t, a[1] + dy * t], d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; const l = Math.sqrt(l2); bp = [p, [dx / l, dy / l]]; } }
            if (bp && bd > 6) S.issueOrder(F, [], [[bp[0][0] - bp[1][0] * 5, bp[0][1] - bp[1][1] * 5], [bp[0][0] + bp[1][0] * 5, bp[0][1] + bp[1][1] * 5]], { free: true, stretch: true, then: 'hold' }); } }
      st.res = []; }
  }
  let nextT = 0; const prevHook = S.cmdHook;
  S.cmdHook = function () { if (prevHook) prevHook(); if (!S.ai[s]) return;
    for (const q of plan) { if (q.done || S.t < q.t * 60) continue; if (!q.F.active || q.F.dead) { if (q.F.dead) q.done = true; continue; } q.done = true; if (st.withdrawn) continue; commitArrival(q); }
    if (S.t >= nextT) { nextT = S.t + cfg.tickH * 60; tick(); } };
  return S;
}
if (typeof module !== 'undefined') module.exports = { attachTheater, THEATER };

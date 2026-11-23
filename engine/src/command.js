// ===== COMMAND LAYER: corps and armies above the formations =====
// A command node holds formations (divisions) or other command nodes (corps under an army).
// The player, or a superior's AI, draws one line of advance and one objective line for the node.
// The node's commander takes staff time to plan, splits the objective line into sectors left to right,
// keeps a reserve when his style calls for it, and passes each child a parallel line of advance, so sister
// formations do not cross each other's routes. Children then plan their own orders as before.
function attachCommand(S) {
  const nodes = []; S.commands = nodes;
  const segOf = (line, a, b) => {           // the part of polyline `line` between distances a and b
    const out = [], A = polyAt(line, a); out.push([A.x, A.y]); let acc = 0;
    for (let i = 1; i < line.length; i++) { acc += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]); if (acc > a && acc < b) out.push([line[i][0], line[i][1]]); }
    const B = polyAt(line, b); out.push([B.x, B.y]); return out;
  };
  function pos(n) {                         // where a node stands: the centre of its children's fighting units
    if (n.forms) { let x = 0, y = 0, k = 0; for (const F of n.forms) { const p = pos(F); if (p) { x += p[0]; y += p[1]; k++; } } return k ? [x / k, y / k] : null; }
    let x = 0, y = 0, k = 0; for (const u of n.subs) if (u.active && !u.dead && u.cls !== 'hq' && u.mv !== 'ship') { x += u.x; y += u.y; k++; } return k ? [x / k, y / k] : null;
  }
  function weight(n) {                      // frontage a child can hold: its fighting units still in being
    if (n.forms) return n.forms.reduce((s, c) => s + weight(c), 0);
    return n.subs.filter(u => u.active && !u.dead && LEADCLS[u.cls]).length * (n.dead ? 0 : 1);
  }
  const live = n => n.forms ? n.forms.some(live) : !n.dead && n.subs.some(u => u.active && !u.dead);

  // create a command node: { n, s, cmd: { n, ag, sk }, forms: [formations or nodes], parent }
  S.mkCommand = function (o) { const C = Object.assign({ id: nodes.length, order: null, status: 'No orders', log: [] }, o); for (const c of C.forms) c.parent = C; nodes.push(C); return C; };

  // plan the split of one order across the node's children. Returns [{ child, path, line, reserve }].
  S.planCommandOrder = function (C, path, line, opt) {
    opt = opt || {}; const kids = C.forms.filter(live); if (!kids.length || !line || line.length < 2) return [];
    const p0 = pos(C) || line[0], L = polyLen(line), mid = polyAt(line, L / 2);
    let ax = mid.x - p0[0], ay = mid.y - p0[1]; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
    const px = -ay, py = ax;                 // left-hand perpendicular of the axis of advance
    // the objective line runs left to right as the commander faces it
    const side = (q) => (q[0] - mid.x) * px + (q[1] - mid.y) * py;
    const ln = side(line[0]) >= side(line[line.length - 1]) ? line.slice() : line.slice().reverse();
    // children ordered left to right by where they stand now, so assignments do not cross
    const at = kids.map(c => ({ c, p: pos(c) || p0 })).sort((a, b) => ((b.p[0] - p0[0]) * px + (b.p[1] - p0[1]) * py) - ((a.p[0] - p0[0]) * px + (a.p[1] - p0[1]) * py));
    // a reserve: cautious commanders hold one child back when they have three or more
    const ag = C.cmd ? C.cmd.ag : .5; let reserve = null;
    if (opt.reserve !== false && at.length >= 3 && (opt.reserve === true || ag < .65)) {
      let ri = 0, bw = 1e9; at.forEach((o, i) => { const w = weight(o.c); if (i > 0 && i < at.length - 1 && w < bw) { bw = w; ri = i; } }); if (!ri) ri = Math.floor(at.length / 2);
      reserve = at.splice(ri, 1)[0];
    }
    const W = at.reduce((s, o) => s + Math.max(1, weight(o.c)), 0); let acc = 0; const out = [];
    const P = (path && path.length ? path : []).filter(q => q);
    for (const o of at) {
      const w = Math.max(1, weight(o.c)), a = acc / W * L, b = (acc + w) / W * L; acc += w;
      const seg = segOf(ln, a, b), sm = polyAt(ln, (a + b) / 2), off = side([sm.x, sm.y]);
      const cp = P.map(q => [q[0] + px * off, q[1] + py * off]);          // corps route shifted to the child's sector
      out.push({ child: o.c, path: cp, line: seg, reserve: false });
    }
    if (reserve) {                           // reserve keeps its own lane, parallel to its neighbours, and halts 6 km short of the objective
      const roff = Math.max(-L / 2, Math.min(L / 2, (reserve.p[0] - p0[0]) * px + (reserve.p[1] - p0[1]) * py)), hw = 1.5;
      const bx = mid.x - ax * 6 + px * roff, by = mid.y - ay * 6 + py * roff;
      out.push({ child: reserve.c, path: P.map(q => [q[0] + px * roff, q[1] + py * roff]), line: [[bx + px * hw, by + py * hw], [bx - px * hw, by - py * hw]], reserve: true });
    }
    return out;
  };

  // issue an order to a node: staff time first, then the children receive theirs
  S.issueCommandOrder = function (C, path, line, opt) {
    opt = opt || {}; const sk = C.cmd ? C.cmd.sk : .6, lvl = C.level === 'army' ? 1.5 : 1;
    const delay = opt.free ? 0 : (40 + 80 * (1 - sk)) * lvl * (1 + (S.rnd() - .3) * .25);
    C.order = { path: path || [], line, opt, t0: S.t + delay, st: 'pending' };
    C.status = delay ? (C.level === 'army' ? 'Army' : 'Corps') + ' staff planning (' + Math.round(delay) + ' min)' : 'Orders passed down';
    if (!delay) release(C); return delay;
  };
  function release(C) {
    const O = C.order; O.st = 'issued'; const plan = S.planCommandOrder(C, O.path, O.line, O.opt);
    for (const q of plan) {
      const o = Object.assign({}, O.opt, q.reserve ? { then: 'reserve' } : {}); delete o.reserve;
      if (q.child.forms) S.issueCommandOrder(q.child, q.path, q.line, o); else S.issueOrder(q.child, q.path, q.line, o);
    }
    O.plan = plan.map(q => ({ n: q.child.n, reserve: q.reserve }));
    C.status = 'Orders passed to ' + plan.length + (plan.some(q => q.reserve) ? ', one in reserve' : '');
    S.say(C.s, C.n + ': orders passed to ' + plan.map(q => q.child.n + (q.reserve ? ' (reserve)' : '')).join(', ') + '.', 1);
  }
  // called once per simulation step
  const prevHook = S.cmdHook;
  S.cmdHook = function () { if (prevHook) prevHook(); for (const C of nodes) if (C.order && C.order.st === 'pending' && S.t >= C.order.t0) release(C); };
  return S;
}

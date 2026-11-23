// ===== DIVISION TEMPLATES: 1944 divisions as regiments, brigades or combat commands of battalions =====
// Structures follow the standard 1944 organizations in outline. Exact battalion counts, attachments and equipment for each
// historical division come from the order-of-battle data in step 4, with sources; these templates are the starting shape.
// {a}, {b}, {c} are replaced by the regiment or brigade designations given for each division.
const DIVTPL = {
  us_inf: { nat: 'US', regs: [
    { n: '{a} Infantry', role: 'man', sub: ['us_inf|1/{a} Infantry', 'us_inf|2/{a} Infantry', 'us_inf|3/{a} Infantry'] },
    { n: '{b} Infantry', role: 'man', sub: ['us_inf|1/{b} Infantry', 'us_inf|2/{b} Infantry', 'us_inf|3/{b} Infantry'] },
    { n: '{c} Infantry', role: 'man', sub: ['us_inf|1/{c} Infantry', 'us_inf|2/{c} Infantry', 'us_inf|3/{c} Infantry'] },
    { n: 'Division Artillery', role: 'arty', sub: ['us_fa105|105mm FA Bn', 'us_fa105|105mm FA Bn', 'us_fa105|105mm FA Bn', 'us_fa155|155mm FA Bn'] },
    { n: 'Division troops', role: 'troops', sub: ['us_eng|Engineer Combat Bn', 'us_rec|Cavalry Recon Troop|.35'] }],
    attach: ['us_tk_m4|Tank Bn (attached)', 'us_td_m10|Tank Destroyer Bn (attached)', 'us_aaaw|AAA AW Bn (attached)'] },
  us_arm: { nat: 'US', regs: [
    { n: 'CCA', role: 'man', sub: ['us_tk_m4|Tank Bn (CCA)', 'us_arminf|Armored Infantry Bn (CCA)'] },
    { n: 'CCB', role: 'man', sub: ['us_tk_m4|Tank Bn (CCB)', 'us_arminf|Armored Infantry Bn (CCB)'] },
    { n: 'CCR', role: 'man', sub: ['us_tk_m4|Tank Bn (CCR)', 'us_arminf|Armored Infantry Bn (CCR)'] },
    { n: 'Division Artillery', role: 'arty', sub: ['us_afa|Armored FA Bn', 'us_afa|Armored FA Bn', 'us_afa|Armored FA Bn'] },
    { n: 'Division troops', role: 'troops', sub: ['us_eng|Armored Engineer Bn', 'us_rec|Cavalry Recon Sqn'] }],
    attach: ['us_td_m18|Tank Destroyer Bn (attached)', 'us_aaaw|AAA AW Bn (attached)'] },
  us_abn: { nat: 'US', regs: [
    { n: '{a} Parachute Infantry', role: 'man', sub: ['us_para|1/{a} PIR', 'us_para|2/{a} PIR', 'us_para|3/{a} PIR'] },
    { n: '{b} Parachute Infantry', role: 'man', sub: ['us_para|1/{b} PIR', 'us_para|2/{b} PIR', 'us_para|3/{b} PIR'] },
    { n: '{c} Glider Infantry', role: 'man', sub: ['us_glider|1/{c} GIR', 'us_glider|2/{c} GIR'] },
    { n: 'Division Artillery', role: 'arty', sub: ['us_pfa|Parachute FA Bn', 'us_pfa|Parachute FA Bn', 'us_gfa105|Glider FA Bn'] },
    { n: 'Division troops', role: 'troops', sub: ['us_eng|Airborne Engineer Bn|.7'] }], attach: [] },
  uk_inf: { nat: 'UK', regs: [
    { n: '{a} Infantry Brigade', role: 'man', sub: ['uk_inf|Bn ({a} Bde)', 'uk_inf|Bn ({a} Bde)', 'uk_inf|Bn ({a} Bde)'] },
    { n: '{b} Infantry Brigade', role: 'man', sub: ['uk_inf|Bn ({b} Bde)', 'uk_inf|Bn ({b} Bde)', 'uk_inf|Bn ({b} Bde)'] },
    { n: '{c} Infantry Brigade', role: 'man', sub: ['uk_inf|Bn ({c} Bde)', 'uk_inf|Bn ({c} Bde)', 'uk_inf|Bn ({c} Bde)'] },
    { n: 'Royal Artillery', role: 'arty', sub: ['uk_fd25|Field Regt RA', 'uk_fd25|Field Regt RA', 'uk_fd25|Field Regt RA'] },
    { n: 'Division troops', role: 'troops', sub: ['uk_at|Anti-Tank Regt RA', 'uk_rec|Reconnaissance Regt', 'uk_re|Field Coys RE'] }],
    attach: ['uk_tk_sher|Armoured Regt (attached)'] },
  uk_arm: { nat: 'UK', regs: [
    { n: '{a} Armoured Brigade', role: 'man', sub: ['uk_tk_sher|Armoured Regt ({a} Armd Bde)', 'uk_tk_sher|Armoured Regt ({a} Armd Bde)', 'uk_tk_sher|Armoured Regt ({a} Armd Bde)', 'uk_mot|Motor Bn ({a} Armd Bde)'] },
    { n: '{b} Infantry Brigade', role: 'man', sub: ['uk_inf|Bn ({b} Bde)', 'uk_inf|Bn ({b} Bde)', 'uk_inf|Bn ({b} Bde)'] },
    { n: 'Royal Artillery', role: 'arty', sub: ['uk_sexton|Field Regt RA (SP)', 'uk_fd25|Field Regt RA'] },
    { n: 'Division troops', role: 'troops', sub: ['uk_tk_crom|Armoured Recce Regt', 'uk_at|Anti-Tank Regt RA', 'uk_re|Field Sqns RE'] }], attach: [] },
  ge_inf: { nat: 'GE', regs: [
    { n: 'Grenadier-Regiment {a}', role: 'man', sub: ['ge_inf|I./GR {a}', 'ge_inf|II./GR {a}'] },
    { n: 'Grenadier-Regiment {b}', role: 'man', sub: ['ge_inf|I./GR {b}', 'ge_inf|II./GR {b}'] },
    { n: 'Grenadier-Regiment {c}', role: 'man', sub: ['ge_inf|I./GR {c}', 'ge_inf|II./GR {c}'] },
    { n: 'Artillerie-Regiment', role: 'arty', sub: ['ge_art105|I./AR', 'ge_art105|II./AR', 'ge_art105|III./AR', 'ge_art150|IV./AR'] },
    { n: 'Divisionstruppen', role: 'troops', sub: ['ge_inf|Fuesilier-Btl|.8', 'ge_jpz|Panzerjaeger-Abt', 'ge_pio|Pionier-Btl'] }], attach: [] },
  ge_pz: { nat: 'GE', regs: [
    { n: 'Panzer-Regiment {a}', role: 'man', sub: ['ge_pan|I./PzR {a} (Panther)', 'ge_pz4|II./PzR {a} (Pz IV)'] },
    { n: 'Panzergrenadier-Regiment {b}', role: 'man', sub: ['ge_pzgr_spw|I./PzGrR {b} (gep)', 'ge_pzgr|II./PzGrR {b}'] },
    { n: 'Panzergrenadier-Regiment {c}', role: 'man', sub: ['ge_pzgr|I./PzGrR {c}', 'ge_pzgr|II./PzGrR {c}'] },
    { n: 'Panzer-Artillerie-Regiment', role: 'arty', sub: ['ge_wespe|I./PzAR (Wespe/Hummel)', 'ge_art105|II./PzAR', 'ge_art150|III./PzAR'] },
    { n: 'Divisionstruppen', role: 'troops', sub: ['ge_krad|Panzer-Aufklaerungs-Abt', 'ge_jpz|Panzerjaeger-Abt', 'ge_pio|Panzer-Pionier-Btl', 'ge_flak20|Heeres-Flak-Abt'] }], attach: [] },
  ge_fj: { nat: 'GE', regs: [
    { n: 'Fallschirmjaeger-Regiment {a}', role: 'man', sub: ['ge_fj|I./FJR {a}', 'ge_fj|II./FJR {a}', 'ge_fj|III./FJR {a}'] },
    { n: 'Fallschirmjaeger-Regiment {b}', role: 'man', sub: ['ge_fj|I./FJR {b}', 'ge_fj|II./FJR {b}', 'ge_fj|III./FJR {b}'] },
    { n: 'Fallschirmjaeger-Regiment {c}', role: 'man', sub: ['ge_fj|I./FJR {c}', 'ge_fj|II./FJR {c}', 'ge_fj|III./FJR {c}'] },
    { n: 'Fallschirm-Artillerie-Regiment', role: 'arty', sub: ['ge_art105|I./FAR', 'ge_art105|II./FAR'] },
    { n: 'Divisionstruppen', role: 'troops', sub: ['ge_pak|Fallschirm-Panzerjaeger-Abt', 'ge_pio|Fallschirm-Pionier-Btl'] }], attach: [] }
};
// build a scenario formation from a template: o = { tpl, s, n, cmd, ag, sk, xp, x, y, regs: ['8th', '12th', '22nd'], attach: [...] }
function divForm(o) {
  const T = DIVTPL[o.tpl]; if (!T) throw new Error('unknown division template ' + o.tpl);
  const names = o.regs || [], fill = t => t.replace('{a}', names[0] || 'A').replace('{b}', names[1] || 'B').replace('{c}', names[2] || 'C');
  const sub = [], regs = [];
  for (const R of T.regs) { const idx = []; for (const sp of R.sub) { idx.push(sub.length); sub.push(fill(sp)); } regs.push({ n: fill(R.n), role: R.role, idx }); }
  const att = o.attach || T.attach || []; if (att.length) { const idx = []; for (const sp of att) { idx.push(sub.length); sub.push(fill(sp)); } regs.push({ n: 'Attached', role: 'troops', idx }); }
  const f = Object.assign({ nat: T.nat, ag: .5, sk: .6, xp: 1 }, o, { sub, regs }); delete f.tpl; delete f.attach; return f;
}
// where each regiment, brigade or combat command stands: the centre of its living battalions, for the map's middle zoom
function regCentres(F) {
  return (F.regs || []).map(R => { const us = R.subs.filter(u => u.active && !u.dead); if (!us.length) return null;
    return { n: R.n, role: R.role, reserve: F.resReg === R, x: us.reduce((s, u) => s + u.x, 0) / us.length, y: us.reduce((s, u) => s + u.y, 0) / us.length, str: us.reduce((s, u) => s + u.str * u.size, 0) / us.reduce((s, u) => s + u.size, 0) }; }).filter(Boolean);
}

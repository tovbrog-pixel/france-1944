// ===== Tutorial: command post exercise on fictional training ground =====
SCENARIOS.push({
  id: 'tutorial', tutorial: 1, labels: ['Blue', 'Red'], title: 'Tutorial: Exercise Cane River', sub: 'Camp Hollister Maneuver Area (fictional), June 1943', start: '1943-06-14T06:00', hours: 48,
  w: 44, h: 32, cs: .75, base: 'open', theme: 'temperate', seed: 77, hillT: 70, mtnT: 9999,
  elev: { base: 20, noise: [14, 6], hills: [[35, 11, 4, 110], [7, 12, 4, 100], [20, 19.5, 2.5, 80], [38, 26, 4, 70]] },
  forest: [[6, 22, 4, 1], [36, 20, 3.5, 1], [16, 5, 4, 2], [30, 5, 3, 1], [40, 12, 3, 2], [27, 26, 2.5, 1], [3, 9, 3, 1]],
  rivers: [['Cane River', 1, [[0, 17], [10, 16.2], [14, 16], [22, 15.4], [30, 16], [38, 16.8], [44, 16]]], ['Mill Creek', 2, [[22, 15.4], [19, 11], [17, 6], [16, 0]]]],
  roads: [
    [3, [[22, 32], [22, 29], [22, 23], [26, 19], [30, 16], [30, 12], [26, 10], [22, 9], [22, 0]]],
    [2, [[22, 29], [16, 24], [14, 17.5], [14, 16], [13, 12], [10, 8], [10, 0]]],
    [2, [[10, 8], [22, 9], [36, 7], [44, 6]]], [1, [[0, 24], [16, 24], [22, 23], [34, 22], [44, 22]]], [1, [[30, 12], [36, 7]]],
  ],
  towns: [['Camp Hollister', 22, 29, 2], ['Harlan', 30, 12, 2], ['Tyler Junction', 22, 9, 1], ['Cedar Grove', 10, 8, 1], ['Miller\'s Ford', 14, 17.6, 1], ['Oakdale', 36, 7, 1], ['Pikeville', 34, 22, 1]],
  bridges: [[30, 16, { name: 'Harlan bridge', wired: .9, own: 1, repairH: 5 }], [14, 16, { name: 'Miller\'s Ford bridge', wired: 0, own: 1 }]],
  weather: ['clear', 'cloud', 'overcast', 'clear'],
  sides: [
    { name: 'Blue Force (you)', rear: [0, 1], posture: 'attack', assets: [{ k: 'boats', n: 26, nm: 'Assault boats (engineer)' }, { k: 'bridge', n: 1, nm: 'Treadway bridge set' }],
      sources: [{ n: 'Camp Hollister depot', x: 22, y: 31, stock: 40, rate: 3 }],
      pool: [{ k: 'us_fa155', n: '1st Field Artillery Bn (155mm)', x: 21, y: 30, t: 0 }, { k: 'us_eng', n: '1st Engineer Combat Bn', x: 23, y: 30, t: 0 }, { k: 'us_td_m10', n: '1st Tank Destroyer Bn', x: 22, y: 30.5, t: 6 }],
      bases: [{ n: 'Hollister Field', x: 28, y: 31 }],
      groups: [['Blue fighter-bomber squadron', 'p47', 16, 0, 'cas'], ['Blue fighter squadron', 'p51', 16, 0, 'cap'], ['Blue light bomber squadron', 'a20', 12, 0, 'int']] },
    { name: 'Red Force (opposing force)', rear: [0, -1], posture: 'defend',
      sources: [{ n: 'Tyler Junction dump', x: 22, y: 8.4, stock: 25, rate: 1.5 }, { n: 'North road', x: 22, y: 1.2, stock: 20, rate: 1.5 }],
      pool: [], bases: [{ n: 'Red airstrip', x: 38, y: 2 }], groups: [['Red fighter squadron', 'p40', 12, 0, 'cap']] }],
  forms: [
    { s: 0, nat: 'US', n: '1st Infantry Regiment (Blue)', cmd: 'Col. Amos Whitfield', ag: .65, sk: .75, xp: 1.05, x: 22, y: 26.6, sub: ['us_inf|1st Bn, 1st Infantry', 'us_inf|2nd Bn, 1st Infantry', 'us_inf|3rd Bn, 1st Infantry', 'us_fa105|10th Field Artillery Bn'] },
    { s: 0, nat: 'US', n: '2nd Infantry Regiment (Blue)', cmd: 'Col. Walter Brandt', ag: .35, sk: .55, xp: 1, x: 16.6, y: 25, sub: ['us_inf|1st Bn, 2nd Infantry', 'us_inf|2nd Bn, 2nd Infantry', 'us_inf|3rd Bn, 2nd Infantry', 'us_fa105|11th Field Artillery Bn'] },
    { s: 0, nat: 'US', n: 'Combat Command A (Blue)', cmd: 'Brig. Gen. Thomas Keller', ag: .85, sk: .8, xp: 1.05, x: 23.4, y: 29.6, sub: ['us_tk_m4|1st Tank Bn', 'us_arminf|1st Armored Infantry Bn', 'us_afa|1st Armored Field Artillery Bn', 'us_rec|1st Cavalry Recon Sqn|.6'] },
    { s: 0, nat: 'US', n: 'Parachute Battalion (Blue)', cmd: 'Lt. Col. James Rourke', ag: .8, sk: .8, xp: 1.2, x: 27, y: 7.6, arr: { t: 8, mode: 'air', from: [44, 30] }, sub: ['us_para|1st Parachute Bn', 'us_para|2nd Parachute Bn|.6'] },
    { s: 1, nat: 'UK', n: 'Red 1st Regiment', cmd: 'Col. Edwin Marsh', ag: .45, sk: .6, xp: .9, x: 14, y: 14.4, dug: 1, hold: 1, line: [[12.4, 14.9], [15.8, 14.7]], sub: ['uk_inf|Red 1st Bn', 'uk_inf|Red 2nd Bn|.8', 'uk_at|Red anti-tank battery|.7'] },
    { s: 1, nat: 'UK', n: 'Red 2nd Regiment', cmd: 'Col. Howard Pruitt', ag: .5, sk: .65, xp: .95, x: 30, y: 14.2, dug: 1, hold: 1, line: [[26.6, 14.4], [33.6, 14.6]], sub: ['uk_inf|Red 3rd Bn', 'uk_inf|Red 4th Bn', 'uk_fd25|Red field artillery'] },
    { s: 1, nat: 'UK', n: 'Red Armored Reserve', cmd: 'Col. Lyle Tanner', ag: .7, sk: .7, xp: .95, x: 22.6, y: 9.6, res: 1, sub: ['uk_tk_sher|Red tank battalion|.7', 'uk_mot|Red motor battalion'] },
  ],
  vp: [['Harlan', 30, 12, 20, 1], ['Tyler Junction', 22, 9, 30, 1], ['Cedar Grove', 10, 8, 10, 1], ['Camp Hollister', 22, 29, 20, 0]],
  brief: ['A command post exercise on fictional ground. Your chief of staff walks you through the map, orders, support, air and supply, and recommends what to do next. Blue Force crosses the Cane River and takes Harlan, Tyler Junction and Cedar Grove within 48 hours.', 'Red Force holds the Cane River line.'],
  hist: 'This is a training exercise on fictional ground. No battle was fought here.'
});
// ===== Tutorial for the France campaign: a Second Army maneuver in the Tennessee Maneuver Area, 1943 =====
// Ground: Middle Tennessee between Lebanon and the Cumberland River. Towns sit at their real positions (latitude and longitude
// projected to UTM 16N, map origin 36.42 N 86.36 W); roads and the river course are drawn by Claude from those positions (inference).
// Second Army held division and corps maneuvers here from 1941 to 1944, including Cumberland River crossings (general history).
// The forces, commanders and plan of this exercise are fictional. The chief umpire is the advisor.
SCENARIOS.push({
  id: 'tutorial-tn', tutorial: 1, labels: ['Blue', 'Red'], title: 'Tutorial: Exercise Cumberland', sub: 'Tennessee Maneuver Area, Second Army, June 1943', start: '1943-06-14T06:00', hours: 48,
  w: 48, h: 40, cs: .75, base: 'open', theme: 'temperate', seed: 79, hillT: 230, mtnT: 9999, view: { x: 24, y: 24, dist: 74, pitch: 1.3 },
  elev: { base: 165, noise: [16, 6], hills: [[10, 1, 6, 120], [30, 3, 7, 140], [44, 7, 5, 140], [22, 11, 3, 80], [45, 30, 5, 90], [3, 36, 4, 60]], ridges: [[0, 12, 48, 10, 4, -25]] },
  forest: [[8, 30, 4, 1], [10, 33, 2.5, 2], [25, 31, 3, 1], [10, 2, 4, 2], [35, 5, 4, 1], [44, 12, 3, 2], [24, 2, 3, 1], [42, 33, 3, 1]],
  rivers: [['Cumberland River', 1, [[48, 13], [43, 17], [38, 19.6], [34, 20.2], [30, 19.5], [27, 17.6], [25.5, 16.6], [24, 14], [22, 10], [19.5, 6.6], [17, 5.2], [13, 6.5], [9, 9.5], [4, 10], [0, 9.5]]],
    ['Round Lick Creek', 2, [[21, 40], [24, 33], [27, 26], [29, 21], [30, 19.5]]]],
  roads: [
    [3, [[6.4, 23.5], [8.5, 17], [12, 11], [15.5, 6.6], [16.6, 5.2], [17.2, 3.1], [18, 0]]],
    [3, [[0, 24], [6.4, 23.5], [15, 25.5], [25, 25], [32, 26], [38.9, 27.2], [46.9, 24], [48, 23.5]]],
    [2, [[6.4, 23.5], [13.7, 30.4], [20.8, 35.3], [20.7, 40]]],
    [2, [[20.8, 35.3], [30, 31], [38.9, 27.2], [38.5, 22], [37.5, 20.6], [37.6, 19.6], [36.9, 18.3]]],
    [2, [[36.9, 18.3], [34, 12], [32.4, 8], [27.9, 7.4], [22, 5], [17.2, 3.1], [8, 2.5], [0, 2]]],
    [1, [[25.9, 17.9], [20, 18.6], [14.5, 18.8], [8.5, 17]]], [1, [[27.9, 7.4], [28, 0]]], [1, [[25.9, 17.9], [25, 25]]],
  ],
  towns: [['Lebanon', 6.4, 23.5, 2], ['Hartsville', 17.2, 3.1, 1], ['Carthage', 36.9, 18.3, 1], ['Watertown', 20.8, 35.3, 1], ['Gordonsville', 38.9, 27.2, 1], ['Dixon Springs', 27.9, 7.4, 1],
    ['Riddleton', 32.4, 8, 1], ['Rome', 25.9, 17.9, 1], ['Bellwood', 14.5, 18.8, 1], ['Tuckers Cross Roads', 13.7, 30.4, 1]],
  bridges: [[16.6, 5.2, { name: 'Hartsville bridge', wired: .9, own: 1, repairH: 5 }], [37.6, 19.6, { name: 'Cordell Hull bridge', wired: 0, own: 1 }]],
  weather: ['clear', 'cloud', 'overcast', 'clear'],
  sides: [
    { name: 'Blue Force: maneuver corps (you)', rear: [0, 1], posture: 'attack', assets: [{ k: 'boats', n: 26, nm: 'Assault boats (engineer)' }, { k: 'bridge', n: 1, nm: 'Treadway bridge set' }],
      sources: [{ n: 'Lebanon depot', x: 6.4, y: 25.6, stock: 60, rate: 4 }],
      pool: [{ k: 'us_fa155', n: 'Corps Field Artillery Bn (155mm)', x: 7, y: 25, t: 0 }, { k: 'us_eng', n: 'Corps Engineer Combat Bn', x: 8, y: 25, t: 0 }, { k: 'us_td_m10', n: 'Tank Destroyer Bn', x: 9, y: 25.5, t: 6 }],
      bases: [{ n: 'Lebanon landing strip', x: 4, y: 27 }],
      groups: [['Blue fighter-bomber squadron', 'p47', 16, 0, 'cas'], ['Blue fighter squadron', 'p51', 16, 0, 'cap'], ['Blue light bomber squadron', 'a20', 12, 0, 'int']] },
    { name: 'Red Force (opposing force)', rear: [0, -1], posture: 'defend',
      sources: [{ n: 'Dixon Springs dump', x: 27.9, y: 6.6, stock: 30, rate: 2 }, { n: 'North road', x: 28, y: 1.2, stock: 25, rate: 1.5 }],
      pool: [], bases: [{ n: 'Red airstrip', x: 44, y: 2 }], groups: [['Red fighter squadron', 'p40', 12, 0, 'cap']] }],
  forms: [
    divForm({ tpl: 'us_inf', s: 0, n: '1st Infantry Division (Blue)', cmd: 'Maj. Gen. Amos Whitfield', ag: .65, sk: .75, xp: 1.05, regs: ['1st', '2nd', '3rd'], attach: [], x: 7.5, y: 20.5 }),
    divForm({ tpl: 'us_inf', s: 0, n: '2nd Infantry Division (Blue)', cmd: 'Maj. Gen. Walter Brandt', ag: .35, sk: .55, xp: 1, regs: ['4th', '5th', '6th'], attach: [], x: 22, y: 32.5 }),
    { s: 0, nat: 'US', n: 'Combat Command A (Blue)', cmd: 'Brig. Gen. Thomas Keller', ag: .85, sk: .8, xp: 1.05, x: 14, y: 29.5, sub: ['us_tk_m4|1st Tank Bn', 'us_tk_m4|2nd Tank Bn', 'us_arminf|1st Armored Infantry Bn', 'us_afa|1st Armored Field Artillery Bn', 'us_rec|1st Cavalry Recon Sqn|.6'] },
    { s: 0, nat: 'US', n: 'Parachute Battalion (Blue)', cmd: 'Lt. Col. James Rourke', ag: .8, sk: .8, xp: 1.2, x: 30.5, y: 7.8, arr: { t: 8, mode: 'air', from: [48, 38] }, sub: ['us_para|1st Parachute Bn', 'us_para|2nd Parachute Bn|.6'] },
    { s: 1, nat: 'UK', n: 'Red 2nd Brigade Group', cmd: 'Col. Howard Pruitt', ag: .5, sk: .65, xp: .95, x: 17, y: 4.4, dug: 1, hold: 1, line: [[13, 5.6], [21, 4.2]], sub: ['uk_inf|Red 4th Bn', 'uk_inf|Red 5th Bn', 'uk_inf|Red 6th Bn|.8', 'uk_fd25|Red field artillery', 'uk_at|Red anti-tank battery|.7'] },
    { s: 1, nat: 'UK', n: 'Red 1st Brigade Group', cmd: 'Col. Edwin Marsh', ag: .45, sk: .6, xp: .9, x: 36, y: 18.2, dug: 1, hold: 1, line: [[33, 19.2], [39.5, 18.4]], sub: ['uk_inf|Red 1st Bn', 'uk_inf|Red 2nd Bn|.8', 'uk_fd25|Red field artillery|.6', 'uk_at|Red anti-tank battery|.7'] },
    { s: 1, nat: 'UK', n: 'Red Armored Reserve', cmd: 'Col. Lyle Tanner', ag: .7, sk: .7, xp: .95, x: 27, y: 5.6, res: 1, sub: ['uk_tk_sher|Red tank battalion', 'uk_tk_sher|Red tank battalion|.6', 'uk_mot|Red motor battalion'] },
  ],
  vp: [['Hartsville', 17.2, 3.1, 20, 1], ['Dixon Springs', 27.9, 7.4, 30, 1], ['Carthage', 36.9, 18.3, 10, 1], ['Lebanon', 6.4, 23.5, 20, 0]],
  // the shared tutorial script (ui.js) was written for Exercise Cane River; these replacements carry it to the Tennessee ground and to division command
  tutSub: [['Exercise Cane River', 'Exercise Cumberland'], ['Cane River', 'Cumberland River'], ['I am Colonel Hale, your chief of staff', 'I am Colonel Hale, chief umpire for this maneuver'], ['your chief of staff', 'the chief umpire'], ['chief of staff', 'chief umpire'],
    ["Miller\\'s Ford bridge", 'Cordell Hull bridge'], ["Miller's Ford bridge", 'Cordell Hull bridge'], ["Miller\\'s Ford", 'the Cordell Hull bridge'], ["Miller's Ford", 'the Cordell Hull bridge'],
    ['2nd Infantry</b> north-west to', '2nd Infantry</b> north-east to'], ['east along the north road to Tyler Junction', 'west along the north road to Dixon Springs'], ['near Oakdale road, north-east of Tyler Junction', 'on the Riddleton road, east of Dixon Springs'],
    ['Harlan bridge', 'Hartsville bridge'], ['Harlan', 'Hartsville'], ['Tyler Junction', 'Dixon Springs'], ['Cedar Grove', 'Carthage'], ['Oakdale', 'Riddleton'], ['Camp Hollister', 'Lebanon'], ['Pikeville', 'Bellwood'],
    ['1st Infantry Regiment', '1st Infantry Division'], ['2nd Infantry Regiment', '2nd Infantry Division'], ['regiments', 'divisions'], ['Regiments', 'Divisions'], ['regiment', 'division'], ['Regiment', 'Division'],
    ['Colonel Whitfield', 'General Whitfield'], ['Colonel Brandt', 'General Brandt'], ['colonels', 'generals'], ['colonel', 'general']],
  brief: ['A Second Army maneuver on real ground in Middle Tennessee. The chief umpire walks you through the map, orders, support, air and supply, and recommends what to do next. Blue Force crosses the Cumberland River and takes Hartsville, Dixon Springs and Carthage within 48 hours.', 'Red Force holds the north bank of the Cumberland River at Hartsville and Carthage, with an armored reserve at Dixon Springs. Hold the crossings and the Dixon Springs road junction for 48 hours.'],
  hist: 'Second Army trained divisions and corps in the Tennessee Maneuver Area from 1941 to 1944, with crossings of the Cumberland River. The forces and plan of this exercise are fictional; the towns stand where they are.'
});

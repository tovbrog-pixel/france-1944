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

# Step 3 progress: engine fork

Tov Binyamin Brog · 22 Nov 2026

The engine now runs 43% faster at the France game's unit count, corps and army commanders split one order among their formations without crossing routes, formations travel by rail or road behind the front before deploying, and divisions now fight as regiments of battalions. All eight Lines of Advance scenarios still give results identical to the original engine.

## Done

| Item | What changed | Check |
| --- | --- | --- |
| Regression check | `tools/regress.js` fingerprints each scenario's end state after 48 game hours, seed 12345, against `tools/regress-baseline.json` | All 8 match after every change below |
| Stress test | `tools/stress.js`: Falaise with every formation's units tripled, 756 units on the same map | Baseline 1,814 times real time |
| Combat pair search | A 31 km spatial grid plus a squared-distance test before the exact distance; pairs still visited in original order | Stress test 2,600 times real time, up 43% |
| Ground ownership grid | Cell size now set per scenario (`ownCell`), default 0.5 km as before | Regression unchanged |
| Regiments | Tov's decision: battalions stay the fighting units; regiments, brigades and combat commands group them inside each division. New `engine/src/divisions.js` holds 8 division templates and a builder; the line-slot routine keeps each regiment's battalions together and holds one regiment back | `tools/test-divisions.js` (results below) |
| Transport layer | New `engine/src/transport.js`: road and rail network, commander picks rail, own vehicles, attached trucks or foot march, and a release point, column march, deployment | `tools/test-transport.js` and `tools/test-transport2.js` (results below) |
| Corps and army layer | New `engine/src/command.js`: staff planning time, sectors split left to right by fighting strength, a reserve held back by cautious commanders, parallel routes, armies over corps | `tools/test-command.js`: 0 route crossings for a 4-formation corps and for a 2-corps army |

## How a corps order works now

1. The player draws one line of advance and one objective line for the corps.
2. The corps staff plans for 40 to 120 minutes, depending on the commander's skill; an army staff takes half again as long.
3. The commander faces the objective and orders his divisions left to right by where they stand, so their routes run side by side.
4. He splits the objective line into sectors in proportion to each division's fighting units.
5. With three or more divisions and a cautious style (aggression below 0.65), he holds one back. The reserve keeps its own lane and halts 6 km short of the objective.
6. Each division then plans its own order through the existing engine, with its own staff delay.

## How regiments work now

Tov chose to keep battalions as the units the engine fights with, so the tested combat model stays as it is. Regiments, brigades and combat commands sit between the division and its battalions.

1. A division is built from a template: its regiments, its artillery, its division troops and any attached battalions.
2. When the division takes up a line, each regiment's battalions stand side by side in one sector, with the regiments ordered left to right by where they stand.
3. With three or more regiments and an order that does not stretch the line, the division holds its weakest regiment back, 3.5 km behind the centre. That is two up and one back.
4. Attached battalions, such as a tank battalion, join the regiment nearest to them.
5. `regCentres()` gives each regiment's position and strength for regiment symbols at the map's middle zoom.

| Template | Battalions with HQ | Manoeuvre groups |
| --- | --- | --- |
| US infantry division (3 regiments, tank, tank destroyer and AAA battalions attached) | 19 | 3 |
| US armored division (CCA, CCB, CCR) | 14 | 3 |
| US airborne division | 13 | 3 |
| British infantry division (3 brigades, armoured regiment attached) | 17 | 3 |
| British armoured division (armoured and infantry brigades) | 13 | 2 |
| German infantry division, 1944 type | 14 | 3 |
| German panzer division | 14 | 3 |
| German parachute division | 14 | 3 |

| Regiment test (Falaise map, US infantry division template) | Result |
| --- | --- |
| Ordered to a 12 km line in its own ground | Holding after 4 hours: 22nd Infantry on the left, 8th Infantry on the right, 12th Infantry in reserve 3 to 4 km back |
| All 8 templates added to one scenario | All built and ran |

At about 15 battalions per division, the full theater holds about 3,500 units, including corps and army troops. Tov's laptop should run that near 3,500 times real time. (Inference: estimate from the stress tests and the laptop's measured speed.)

## How transport works now

1. When a formation gets an order, its commander checks whether he is clear of known enemy (6 km, plus up to 6 km more for a less skilled commander).
2. If he is, he searches the road and rail network for the point nearest the objective that he can reach through his own ground without passing near known enemy. That point becomes the release point. Tov's decision: the release point is the commander's call, shown to the player as information.
3. He moves by network only if it brings him at least 12 km closer. He picks rail when it saves time over road, counting loading and unloading. On the road, he goes motorized if 60% of his units have vehicles, in attached trucks if his side has a lift free (two for the Allies and none for the Germans to start), and on foot otherwise.
4. During the move the formation leaves tactical play and travels as a column along the route. Columns slow down when they share a stretch of road, and blackout driving at night runs at 70% speed.
5. At the release point the units unload, form up in an assembly area and carry out the original tactical order without a second planning delay.
6. A road column that runs within 3 km of enemy troops deploys where it stands. Cohesion drops by 0.3, disorder rises, and the formation plans a fresh order.

Starting values, all labeled in the code for balance testing: motor column 22, 14 and 9 km/h by road class; foot march 4 km/h; train 25 km/h; rail loading 4 hours and unloading 3 hours, half again as long away from a station.

| Transport test (Falaise) | Result |
| --- | --- |
| Road network built from the scenario's roads | 2,945 points, 3,031 links, all connected |
| 47th Infantry (9th Div), ordered toward the nearest German unit 31 km away | Attached trucks, 19 km by road; 78 min to prepare, arrived and formed up at 3.0 hours, then advanced tactically |
| Same formation, 78 km objective, test rail line added along the Allied rear | Rail chosen over road; 85 km by train; loading and travel took 7.5 hours and unloading 3.0 more; formed up at 10.5 hours |
| German regiment placed ahead of a road column | Column deployed from the march under pressure, then planned a new order |

## Measured

| Test | Result |
| --- | --- |
| Stress test before changes | 756 units, 24 game h in 47.6 s, 1,814 times real time |
| Stress test after changes | 756 units, 24 game h in 33.2 s, 2,600 times real time |
| Where the stress test spends its time now | Combat 72% (pair checks 60%), commanders 10%, supply 8%, movement 4% |
| Corps test, Falaise, 4 formations | 3 sectors and 1 reserve; no route crossings among them |
| Army test, 2 corps of 2 | Army staff 92 min; both corps passed orders on; no route crossings |

All timings come from one CPU core in Claude's workspace. Tov's laptop ran the original engine about seven times faster.

## Known issue

One formation in each command test halted with "no route" on the Falaise map. The message comes from the existing pathfinder, so the command layer did not cause it; network moves now carry long marches; whether that clears the halts needs a test on a theater map.

## Remaining step 3 work

1. **Regiment follow-ups:** regiment symbols on the map, regimental commanders with their own ratings, and corps artillery and separate battalions outside the divisions.
2. **Transport follow-ups:** air attack on columns and railways, sea moves by boat, columns drawn on the map, and the 1944 road and rail network itself (step 4 data).
3. **Command AI:** corps and army commanders who replan when a division is spent, commit the reserve, and report up.
4. **Time step:** test 5 to 15 minute steps outside combat against combat accuracy.
5. **Theater stress test:** replace the tripled-Falaise proxy with a placeholder Normandy theater once step 4 data exists.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Regression, stress and command test results | `tools/regress.js`, `tools/stress.js`, `tools/test-command.js`, run 22 Nov 2026 | Measured |
| Time breakdown | Timed copy of the engine on the stress test, 8 game hours | Measured |
| Laptop speed ratio | Laptop test report, 22 Nov 2026, in `docs/engine-assessment.md` | Measured |
| Staff times, reserve rule, 6 km halt | Design values chosen for this first version | Starting values for testing |
| Regiment test results | `tools/test-divisions.js`, run 22 Nov 2026 | Measured |
| Division template structures | General knowledge of 1944 tables of organization | To verify in step 4 against FM 101-10, TM-E 30-451 and British war establishments |
| Battalions as fighting units, regiments as a command level | Tov's decision in chat, 22 Nov 2026 | Decided |
| Transport test results | `tools/test-transport.js`, `tools/test-transport2.js`, run 22 Nov 2026 | Measured |
| Transport speeds, loading times, truck lifts | Design values chosen for this first version | Starting values for testing |
| Release point as commander's call, shown as information | Tov's decision in chat, 22 Nov 2026 | Decided |
| Cause of the "no route" halts | Reading of the engine's messages | Inference |

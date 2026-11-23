# Step 3: engine fork (complete)

Tov Binyamin Brog · 22 Nov 2026

Step 3 is complete. The engine runs 43% faster at the France game's unit count, corps and army commanders split one order among their formations without crossing routes, formations travel by rail or road behind the front before deploying, divisions fight as regiments of battalions, corps commanders react during the battle, fighter-bombers hunt columns, and airfields and a troop carrier fleet carry the air war forward. A synthetic theater of 200 divisions ran at 847 times real time in Claude's workspace. All eight Lines of Advance scenarios still give results identical to the original engine.

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

## Reacting commanders

Every half hour a corps or army commander reviews an order in progress. These are starting values for balance testing:

- A division is **spent** below 45% of its fighting units or 0.3 average cohesion, and **stalled** after 3 hours with no progress toward its line.
- He commits his reserve into the sector of a spent, stalled or lost division and pulls the spent one 6 km back to rest and refit.
- With no reserve left, a lost division's line is redrawn among the divisions that remain.
- He reports when every forward division stands on the objective, and acts at most once every 2 hours.
- A division on the move by road or rail counts as alive and making progress.

| Command AI test (Falaise, `tools/test-command-ai.js`) | Result |
| --- | --- |
| Forward formation shattered by hand 3 hours into a corps attack | Reserve committed to its sector 12 minutes later at the next review; the shattered formation went back to rest and refit; corps reported all divisions on the objective at 5.7 hours |

## Air power against movement

- **Fighter-bombers:** the threat over a side's rear comes from the enemy's available fighter-bomber groups, with 150 aircraft making it total. A road column moving by day in flying weather under full threat is attacked 0.12 times an hour on average, trains half as often. Each attack costs every battalion 2 to 5% strength and 0.1 cohesion and stops the column for 20 to 40 minutes.
- **Night moves:** German and Italian columns move only by night when the threat is 0.5 or more.
- **Rail interdiction:** a side with an interdiction priority cuts rail lines in enemy ground every 6 hours. Engineers reopen a cut after 24 to 48 hours, and commanders route around cuts or take the road.

| Air test (Falaise, `tools/test-air.js`) | Result |
| --- | --- |
| Threat over each side's rear, from the scenario's air groups | Over the Germans 1.00; over the Allies 0.08 |
| 116. Panzer-Division road move, 19 km | Night only: waited 12 hours under cover, then moved after dark |
| Allied column under threat forced to 1, 20 seeds | 2 attacks in 29.8 daylight column-hours, 0.07 per hour against the 0.12 setting; a small sample |
| Test rail line cut near its middle | Commander switched from rail to trucks; 4 more interdiction cuts in 40 hours kept the line closed |

## Airfields and air transport

Added after Tov asked about airfields and air transport. New `engine/src/air.js`, building on the engine's existing air bases, airborne drops and supply drops:

- **Airfields** have a capacity in air groups and a condition. Fields in England sit off the map, so their aircraft fly the full distance to every target.
- **Building:** engineers build a landing ground in their own ground in 72 engineer-battalion hours. It bases 3 groups.
- **Capture:** a field overrun by the enemy is lost; groups there lose 30% of the aircraft on the ground and fall back. The captor gets the field at condition 0.2, and his engineers repair it.
- **Moving forward:** every 6 hours the air commander moves a group to a field with room that is at least 40 km nearer the fighting. The group is out of action for a day while it moves.
- **Troop carrier fleet:** one pool of transport aircraft serves airborne lifts, the engine's supply drops (40 aircraft each) and airlifts of supply to forward airfields. Each aircraft flies one lift a day.
- **Airborne operations:** a division in England drops after 6 hours of preparation, in as many daily lifts as the fleet allows, headquarters and infantry first. Lifts wait for flying weather and daylight unless ordered by night.
- **Refit:** an airborne division withdrawn from the line refits in England for 14 days before it can drop again.

| Air test (Falaise copies, `tools/test-air2.js`) | Result |
| --- | --- |
| Allied groups based off the map in England; one engineer battalion builds a landing ground | Ready after 72 hours; at the next air review 3 groups moved onto it, up to its capacity |
| German field inside Allied-held ground | Overrun within 2 hours; JG 1 / JG 26 lost 2 aircraft on the ground and fell back to the other field; the Allies gained the field at condition 0.2 |
| US airborne division (13 battalions, 448 aircraft needed) with a 400-aircraft fleet | Lift 1 at 6 hours: 11 units on 388 aircraft; lift 2 at 30 hours: the last 2 units; all within 1.3 km of the drop zone on average |
| Supply drop requested for a formation | Fleet down 40 aircraft |
| 100 aircraft land supply at a forward airfield | New supply source there with 20 units |
| Division withdrawn to refit | New drop refused until the refit ends 14 days later |

## Theater-scale stress test

`tools/theater.js` builds a 220 x 140 km map with placeholder terrain and roads, 1 km map cells and 1 km ownership cells, and fills it with template divisions. The Allies attack south and the Germans hold, AI against AI.

| Theater test | Result |
| --- | --- |
| 100 divisions, 1,546 battalions, 24 game hours | 88.4 s, 978 times real time |
| 200 divisions, about 3,000 battalions, 6 game hours | 25.5 s, 847 times real time |

The full theater size runs at 847 times real time in Claude's workspace. At the laptop's measured ratio of about seven, that is near 6,000 times real time on Tov's laptop (inference).

## Time step: stays at 1 minute

| Falaise, 48 game hours (`tools/timestep.js`) | Wall time | Allied losses | German losses | Battalions destroyed |
| --- | --- | --- | --- | --- |
| 1-minute step, seeds 1 to 3 | 19.2 to 21.4 s | 8.4 to 11.0 | 17.7 to 20.7 | 9 to 12 |
| 2-minute step, seed 1 | 12.3 s | 6.8 | 17.5 | 8 |
| 5-minute step, seed 1 | 8.4 s | 4.7 | 11.8 | 4 |

Longer steps run combat less often and cut losses well outside the spread that different seeds give at 1 minute. The theater test shows the speed is ample, so the engine keeps its 1-minute step.

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

## Carried to later steps

| Item | Where it goes |
| --- | --- |
| Columns, release points and regiment symbols drawn on the map | Step 5, the playable slice's interface |
| Player's air plan: interdiction priorities, landing-ground sites, airborne operations, airlifts | Step 5 interface; the engine side is in place |
| June 1944 airfields and group bases, England and Normandy; troop carrier fleet size | Step 4 data |
| Moves by sea (reinforcements, coastal moves) | Step 4 data, using the engine's existing sea arrivals |
| Regimental commanders with their own ratings; corps artillery and separate battalions | Step 4 order-of-battle data |
| The 1944 road and rail network and real terrain | Step 4 data |
| The "no route" halts seen on the Falaise map | Retest on the real Normandy map in step 4 |

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
| Command AI, air, theater and time-step results | `tools/test-command-ai.js`, `tools/test-air.js`, `tools/theater.js`, `tools/timestep.js`, run 22 Nov 2026 | Measured |
| Airfield and air transport test results | `tools/test-air2.js`, run 22 Nov 2026 | Measured |
| Airfield build, repair, capacity, rebasing, lift and refit values | Design values chosen for this first version | Starting values for testing |
| Command review values, air attack rates and losses, night-move threshold, interdiction and repair times | Design values chosen for this first version | Starting values for testing |
| Laptop speed at theater size | 847 times real time scaled by the laptop's measured ratio | Inference |
| Transport test results | `tools/test-transport.js`, `tools/test-transport2.js`, run 22 Nov 2026 | Measured |
| Transport speeds, loading times, truck lifts | Design values chosen for this first version | Starting values for testing |
| Release point as commander's call, shown as information | Tov's decision in chat, 22 Nov 2026 | Decided |
| Cause of the "no route" halts | Reading of the engine's messages | Inference |

# Step 5 progress: the vertical slice

Tov Binyamin Brog · 23 Nov 2026

Step 5 builds the playable slice from D-Day to 1 September 1944 on the step 4 data, writes its operations orders and the Tennessee tutorial, and tests it AI against AI.

## The Overlord scenario

`tools/scenario-overlord.js` builds the scenario from the data files; nothing in it is typed by hand except the placement rules marked below.

| Item | Contents | Source or rule |
| --- | --- | --- |
| Map | 600 x 330 km at 1 km cells, Brest to Paris and the Channel to the Loire: 25,770 road pieces, 4,045 rail pieces of the 1944 network, 409 bridges, 1,030 towns | Step 4 terrain and network data |
| Allied forces | 39 divisions, each landing on its arrival date | `data/oob/allied-1944.json` |
| Assault | Six divisions by sea from H-Hour (0630 US, about an hour later British and Canadian); 82nd, 101st and 6th Airborne by night | Craven and Cate III p. 143; Ellis I; H-Hour times general history (verify) |
| Follow-up landings | Over the beach of the corps the division joined | Corps from `attachments-1944.json`; beach rule inference |
| German forces | 44 divisions: 22 in their 6 June positions, 22 entering from the map edge | `data/oob/german-1944.json` |
| German movement | Each division sets out early enough to reach the place its arrival note names on its sourced date, by an estimated march of 150 km a day for panzer divisions and 35 km for others | Arrival notes sourced; march estimate and exact points inference |
| German holding | Divisions sent to the Normandy front, and the coast divisions, hold their sectors until 16 August | Hitler's withdrawal order, general history (verify against Blumenson) |
| Objectives | 383: Paris 40, Cherbourg and Caen 30, Brest 25, towns of 10,000 people 10 or 20, small road towns 3; suburbs within 10 km of a larger objective (16 km of Paris) fold into it | Points are game settings |
| Supply | Five beach dumps from H+8 to H+9; Mulberry B from 16 June; Cherbourg port 456 hours after capture; six German depots on the roads in | Ruppenthal I p. 406 for Mulberry B; Cherbourg time general history (verify); stocks and rates game settings |
| Air | Airfields open on 6 June; 1,360 Allied troop carriers against 31 German; German air groups scaled to 319 operational aircraft | `data/air`; Ellis I pp. 72-73, 566 |
| Weather | 12-hour periods: overcast on D-Day, rain through the storm of 19 to 22 June, the rest drawn with a fixed seed | Ruppenthal I p. 406 for the storm; the rest inference |
| Naval gunfire | Five bombardment groups off the five beaches | General history (verify against Ellis I ch. VIII) |

## Engine changes

- **Step 3 modules switched on.** The road and rail transport model and the air model from step 3 were attached only in tests. A scenario now asks for them with `modules: ['transport', 'air']`, and `sim.js` attaches them at setup. With them on, the 12th SS Panzer Division moves by night, halts under cover by day, and reaches Caen on 7 June, the sourced date.
- **Detour allowance.** A battalion refused any route more than 1.9 times the direct line plus 5 km, which stopped divisions at rivers on 1 km cells. The allowance is now a scenario setting (`detourKm`, 14 km for Overlord).
- **Standing orders that lapse.** `stayUntil` ends a division's order to hold at a set hour.
- **AI phase lines.** `phaseLines` keep AI-run formations of a side from objectives beyond a line until a set hour. The player's own divisions are not bound.
- **Display.** The sea draws on real-map scenarios. Town labels skip any label that would overlap a larger town's. On maps with more than 40 objectives, small objective flags hide at theatre zoom and the bar shows the 16 largest. Airfield labels thin out when a side has more than six fields. A scenario can set its opening view.
- **Regression.** All earlier scenarios give the same results as before.

## Operations orders

`docs/orders/` holds the four role orders and the shared annexes in the FM 101-5 field order form: heading, five paragraphs, signature, OFFICIAL authentication, annex list and distribution. `tools/build-orders.py` builds the PDFs in `docs/orders/pdf/` with Tov as author. Each order ends with its own source trace. Features the orders describe that are not built yet say so in the text: corps orders, the Fortitude phase, exceeding orders, carpet bombing, airfields opening after 6 June and replacements.

| Document | Pages |
| --- | --- |
| Eisenhower, SHAEF Operations Order No. 1 | 3 |
| Montgomery, 21st Army Group Operations Order No. 1 | 3 |
| Bradley, First US Army Field Order No. 1 | 2 |
| Patton, Third US Army Field Order No. 1 (1 August) | 2 |
| Annexes A to G | 4 |

## Tennessee tutorial

`tutorial-tn` in `engine/src/tutorial.js` puts the shared tutorial script on real ground: the Tennessee Maneuver Area between Lebanon and the Cumberland River, June 1943. Colonel Hale is the chief umpire. Blue commands two infantry divisions, a combat command and a parachute battalion against two Red brigade groups holding the Hartsville and Carthage crossings and an armored reserve at Dixon Springs.

- Towns stand at their real positions, projected from latitude and longitude. The river course and roads are drawn from those positions (inference).
- Forces, commanders and plan are fictional, as they were in the Second Army maneuvers.
- The script's text is carried over by a replacement list in the scenario, so one script serves both tutorials.
- The recorded narration belongs to the older script, so the Tennessee tutorial runs without voice for now.
- In a headless test with Blue following the umpire's plan, Blue held all three objectives at 48 hours.

Still to come for the tutorial: corps orders, supply allocation, air requests through the chain, and political standing. The design document lists all four, and each waits on the interface work below.

## AI-vs-AI testing

`node tools/scenario-overlord.js 1 <hours> <seed> [result.json]` runs the slice headless and reports the capture date of 15 historical objectives against history.

| Run | Changes | Result at three weeks |
| --- | --- | --- |
| 1 | Data only | Caen on D-Day, St-Lô 13 June, Avranches 20 June, Rennes 23 June. German reserves stuck at rivers. |
| 2 | Transport and air modules on; detour allowance; German march timing; German sector holding | Still too fast: the Allies run through the gaps between German sectors |
| 3 | AI phase lines; fighting quality by division | Allies held to the lodgment through 27 June, with no objective south of the phase line. Carentan 6 June (history 12 June), Cherbourg 17 June (26 June), St-Lô 13 June (18 July). The 3rd Division entered Caen on D-Day and the city changed hands before the Allies held it from about 16 June (history 9 July). Losses 81 Allied to 95 German battalion-equivalents |

The AI still takes Caen and St-Lô four to five weeks early, and Cherbourg nine days early. The causes found so far:

1. German divisions hold 8 km sectors with gaps between them, where the historical front was continuous.
2. The staff AI attacks with every free division at once. Montgomery's set-piece rhythm and the build-up of supply before each attack are missing.
3. Bocage and town fighting may favor the defender too little at division scale.

Next calibration work: continuous German sectors drawn from the historical front lines, a set-piece cadence for the AI army groups, and batches of 20 runs per phase as the design document specifies. A three-week run takes about 20 minutes in Claude's workspace, so a full batch runs as a GitHub Actions job.

## Screenshots

- `docs/screenshots/step5-overlord-beaches.png`: the opening view on 6 June, 1400 hours.
- `docs/screenshots/step5-overlord-theatre.png`: the theatre at the same hour.
- `docs/screenshots/step5-tutorial-tn.png`: the Tennessee tutorial with the chief umpire's first note.

## Still to do in step 5

1. Calibration, as above.
2. Interface for corps and army orders, columns and release points on the map, and the player's air plan.
3. Advanced landing grounds opening by date during play.
4. Political score and the four roles' levers.
5. Narration for the Tennessee tutorial.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Allied divisions, arrival dates, corps | `data/oob/allied-1944.json`, `attachments-1944.json` (ETO order of battle; Ellis I) | US sourced; British and Canadian dates verify |
| German positions, arrival dates and destinations | `data/oob/german-1944.json` (Ellis I, Harrison, Blumenson) | 33 arrival dates sourced, 5 inference, 13 verify; destination points inference |
| Airborne times | Craven and Cate III p. 143 | Sourced |
| H-Hour times; naval forces by beach | General history | Verify |
| Mulberry B 16 June; storm 19 to 22 June | Ruppenthal I p. 406 | Sourced |
| Cherbourg clearing time; hold until 16 August; historical capture dates | General history | Verify against Ruppenthal, Blumenson and Ellis |
| 1,360 troop carriers; 319 German aircraft | Ellis I pp. 72-73, 566 | Sourced |
| CCS directive of 12 February 1944 (Eisenhower's order) | Harrison, *Cross-Channel Attack*, Appendix B, pp. 456-457 | Sourced |
| Second Army maneuvers in Tennessee, 1941 to 1944 | General history | Verify |
| Tennessee town positions | Coordinates projected with pyproj (UTM 16N) | Sourced positions; roads and river course inference |
| Test results | `tools/scenario-overlord.js` runs, seed 12345 | Sourced |
| March rates, phase lines, fighting quality, objective points, supply rates | Claude's settings in `tools/scenario-overlord.js` | Inference (game settings) |

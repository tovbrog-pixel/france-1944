# Step 5 progress: the vertical slice

Tov Binyamin Brog · 23 Nov 2026

Step 5 builds the playable slice from D-Day to 1 September 1944 on the step 4 data, writes its operations orders and the Tennessee tutorial, and tests it AI against AI.

## The Overlord scenario

`tools/scenario-overlord.js` builds the scenario from the data files; nothing in it is typed by hand except the placement rules marked below.

| Item | Contents | Source or rule |
| --- | --- | --- |
| Map | 600 x 330 km at 1 km cells, Brest to Paris and the Channel to the Loire: 25,770 road pieces, 4,045 rail pieces of the 1944 network, 409 bridges, 1,030 towns | Step 4 terrain and network data |
| Allied forces | 39 divisions, each landing on its arrival date | `data/oob/allied-1944.json` |
| Assault | Six divisions by sea from H-Hour (0630 US; 0725 Gold and Sword; 0735 and 0745 Juno); 82nd, 101st and 6th Airborne by night | H-Hours: Ellis I p. 143, Harrison p. 300; airborne: Craven and Cate III p. 143 |
| Follow-up landings | Over the beach of the corps the division joined | Corps from `attachments-1944.json`; beach rule inference |
| German forces | 44 divisions: 22 in their 6 June positions, 22 entering from the map edge | `data/oob/german-1944.json` |
| German movement | Each division sets out early enough to reach the place its arrival note names on its sourced date, by an estimated march of 150 km a day for panzer divisions and 35 km for others | Arrival notes sourced; march estimate and exact points inference |
| German holding | Divisions sent to the Normandy front, and the coast divisions, hold their sectors until 16 August | Blumenson p. 527 (withdrawal began 16 August) |
| Objectives | 383: Paris 40, Cherbourg and Caen 30, Brest 25, towns of 10,000 people 10 or 20, small road towns 3; suburbs within 10 km of a larger objective (16 km of Paris) fold into it | Points are game settings |
| Supply | Five beach dumps from H+8 to H+9; Mulberry B from 16 June; Cherbourg port 456 hours after capture; six German depots on the roads in | Ruppenthal I p. 406 for Mulberry B; Cherbourg time general history (verify); stocks and rates game settings |
| Air | Airfields open on 6 June; 1,360 Allied troop carriers against 31 German; German air groups scaled to 319 operational aircraft | `data/air`; Ellis I pp. 72-73, 566 |
| Weather | 12-hour periods: overcast on D-Day, rain through the storm of 19 to 22 June, the rest drawn with a fixed seed | Ruppenthal I p. 406 for the storm; the rest inference |
| Naval gunfire | Five bombardment groups off the five beaches | General history (verify against Ellis I ch. VIII) |

## Engine changes

- **Step 3 modules switched on.** The road and rail transport model and the air model from step 3 were attached only in tests. A scenario now asks for them with `modules: ['transport', 'air']`, and `sim.js` attaches them at setup. With them on, the 12th SS Panzer Division moves by night, halts under cover by day, and reaches Caen on 7 June, the sourced date.
- **Detour allowance.** A battalion refused any route more than 1.9 times the direct line plus 5 km, which stopped divisions at rivers on 1 km cells. The allowance is now a scenario setting (`detourKm`, 14 km for Overlord).
- **Standing orders that lapse.** `stayUntil` ends a division's order to hold at a set hour.
- **Corps from the scenario.** `commands` and `cmdPlan` define corps and the dates divisions join them; `restH` sets how long a side's staff AI waits between objectives.
- **Scheduled airfields.** `fieldPlan` opens fields on their dates once the side holds the site.
- **AI phase lines.** `phaseLines` keep AI-run formations of a side from objectives beyond a line until a set hour. The player's own divisions are not bound.
- **Display.** The sea draws on real-map scenarios. Town labels skip any label that would overlap a larger town's. On maps with more than 40 objectives, small objective flags hide at theatre zoom and the bar shows the 16 largest. Airfield labels thin out when a side has more than six fields. A scenario can set its opening view.
- **Division-scale display.** A scenario sets two zoom thresholds (`divScale`). From far out each division is one symbol with its name and a strength bar. Closer in, the division opens into regiments and artillery, and closer again into battalions. Orders work at every zoom.
- **Empty pockets close.** Each hour, a connected region of one side's ground that holds none of its troops and none of its uncaptured supply sources loses its outer ring of cells to the side around it. Tov asked for this rule.
- **Regression.** The pocket rule changes results, so the baselines were recorded again with `tools/regress.js record`.

## Corps orders

The Overlord scenario builds 12 Allied corps from `data/oob/allied-1944.json` with their commanders, and moves each division into its corps on the dates in `attachments-1944.json` (119 rows). The Forces list groups divisions by corps. A division's card shows its corps, the corps commander and his status, and a switch, **Order the whole corps**. With it on, the line of advance and objective line go to the corps commander. He plans for about an hour, splits the objective line among his divisions from left to right, keeps a reserve when he is cautious, and reviews the attack every half hour: he commits the reserve where a division stalls or is spent, and redraws the sectors if a division is lost. The engine side came from step 3 (`engine/src/command.js`); step 5 adds the scenario corps, the dated membership and the interface. Corps orders go into the save file like any other order. Army and army group orders come next.

## Army orders

Armies sit above the corps: First and Third US Armies, Second British Army and First Canadian Army, with each corps moving between armies on the first date the attachment rows place it there (VIII Corps from First to Third Army on 1 August, for one). The card adds **Order the whole army** beside the corps switch. The army commander splits the objective line among his corps, and each corps commander splits his part among his divisions. Army groups come later.

## Supply priority

Eisenhower's supply lever works by army: the army line on a division's card carries **High**, **Normal** and **Low**. A high-priority army's truck columns carry 30 percent more per trip; a low-priority army's carry 30 percent less and leave the last third of each source's stock to the other armies. The setting goes into the save file. These figures are game settings.

## The Mortain counterattack

AI planned moves can now depend on the situation (`cond`: an objective held by a given side). The four divisions of Operation Lüttich, the 2nd, 116th, 1st SS and 2nd SS Panzer Divisions, attack west toward Avranches on the night of 6/7 August if the Allies hold Avranches by then. Date and divisions are general history, to verify against Blumenson ch. XXV.

## Political score

`engine/src/politics.js` keeps Eisenhower's standing with Washington, London, Paris and Moscow as the design document describes, and the top bar shows the composite. In the slice:

- A week in which American troops take 15 or more objective points raises Washington; a week costing over 12 battalion-equivalents for under 10 points lowers it. The same rule ties British, Canadian and Polish troops to London.
- Cherbourg raises Washington, Caen raises London, Brest raises Washington, and Paris raises Paris, Washington and London, with a further rise in Paris when French troops enter first. Each fires once, after the objective has stayed in Allied hands for a day.
- Paris falls a point a day while the Allies hold Chartres, Orléans, Rouen or Versailles and leave Paris German.
- Phase reviews on 25 July and 22 August warn under a composite of 40 or any capital under 20, and relieve on a second failure; a composite under 25 relieves at once. Relief ends the game only when the player commands the Allies.

Every change is logged with its cause in the reports and the tooltip on the top bar. All values are starting values for balance testing (game design).

## Desktop app

The Windows build now opens the game itself: `tools/build-app.js` builds `app/index.html` with the Overlord slice and both tutorials on the scenario menu. The step 2 technical test moves to `app/techtest.html`.

## Airfields during play

The 70 Allied fields that opened between 7 June and 31 August now open on their dates in `data/air/airfields-1944.json`, once Allied troops hold the site. Air groups move forward to them as before.

## Operations orders

`docs/orders/` holds the four role orders and the shared annexes in the FM 101-5 field order form: heading, five paragraphs, signature, OFFICIAL authentication, annex list and distribution. `tools/build-orders.py` builds the PDFs in `docs/orders/pdf/` with Tov as author. Each order ends with its own source trace. Features the orders describe that are not built yet say so in the text: army orders, the Fortitude phase, exceeding orders, carpet bombing and replacements.

| Document | Pages |
| --- | --- |
| Eisenhower, SHAEF Operations Order No. 1 | 3 |
| Montgomery, 21st Army Group Operations Order No. 1 | 3 |
| Bradley, First US Army Field Order No. 1 | 2 |
| Patton, Third US Army Field Order No. 1 (1 August) | 2 |
| Annexes A to G | 4 |

## Tennessee tutorial

`tutorial-tn` in `engine/src/tutorial.js` is Exercise Cumberland: the Tennessee Maneuver Area between Lebanon and the Cumberland River, June 1943. Colonel Hale is the chief umpire.

- **Scale.** Blue commands the 1st, 2nd and 3rd Infantry Divisions, the 1st Armored Division and a parachute regiment. Red holds the Hartsville and Carthage crossings with two infantry divisions and keeps an armored division in reserve. The 2nd and 3rd Infantry and the 1st Armored form II Corps under Major General Ames.
- **Script.** The tutorial has its own script of 22 steps (`tutScript`). It teaches the map and its zoom levels, the division card, lines of advance, the umpire's plan, corps orders, frontage, support, river crossings, air, the parachute drop, the clock, reports, friction, command, supply, the staff, and scoring.
- **Narration.** Each step plays recorded clips, 56 in all, stored in `engine/voice/` and built into the single-file page with `VOICE_DIR=engine/voice`. Claude generated them with Chatterbox (the Hugging Face Space ResembleAI/Chatterbox) from the voice sample Tov supplied, at exaggeration 0.7 and pace 0.4, and converted them to MP3 at 64 kbps mono and -18 LUFS. The clip texts are in `docs/tutorial/tn-narration-clips.json`.
- **Check on the clips.** An offline recognizer (pocketsphinx) transcribed all 56. Six takes that dropped or slurred words were recorded again: t06_3, t07_3, t08_2, t18_0, t20_0 and t21_2. The recognizer is rough, so a listen-through by Tov is still the final check.
- **Ground.** Towns stand at their real positions, projected from latitude and longitude. The river course and roads are drawn from those positions (inference). Forces, commanders and plan are fictional, as they were in the Second Army maneuvers.

Still to come for the tutorial: supply allocation, air requests through the chain, and political standing. The Forces list in the tutorial may lack a II Corps header; this needs a check.

## AI-vs-AI testing

`node tools/scenario-overlord.js 1 <hours> <seed> [result.json]` runs the slice headless and reports the capture date of 15 historical objectives against history.

| Run | Changes | Result at three weeks |
| --- | --- | --- |
| 1 | Data only | Caen on D-Day, St-Lô 13 June, Avranches 20 June, Rennes 23 June. German reserves stuck at rivers. |
| 2 | Transport and air modules on; detour allowance; German march timing; German sector holding | Still too fast: the Allies run through the gaps between German sectors |
| 3 | AI phase lines; fighting quality by division | Allies held to the lodgment through 27 June, with no objective south of the phase line. Carentan 6 June (history 12 June), Cherbourg 17 June (26 June), St-Lô 13 June (18 July). The 3rd Division entered Caen on D-Day and the city changed hands before the Allies held it from about 16 June (history 9 July). Losses 81 Allied to 95 German battalion-equivalents |

| 4 | German sector lines of 14 km facing the nearest beach, so neighbouring sectors close into a front; the Allied staff AI waits 10 hours between objectives | Cherbourg 24 June (history 26 June). Caen held from about 20 June (9 July). St-Lô changes hands from 13 June (18 July). Losses about even until mid-June, then 60 Allied to 69 German by 22 June |

| 5 | German sector holders dig in on arrival; sourced H-Hours on Gold, Juno and Sword | Cherbourg held from 15 June (26 June); Caen held from 23 June (9 July); St-Lô entered 13 June but not held at three weeks (18 July). Le Havre fell on 23 June, so the phase lines now close the coast east of the Dives until August |

| 6 | AI army commanders give their corps objectives on a rhythm set by the commander's aggression (`armyAI`) | Much faster: Cherbourg, Caen and St-Lô all taken by 13 June. The concentrated corps attacks overwhelm the German sectors, so `armyAI` stays off until it is calibrated |

**Batch 1** (run 4 settings, 19 of 20 full runs to 1 September; `docs/tests/batch1-run4-preliminary.md`) shows the opposite problem over the whole slice. The lodgment battle comes out close to history and then the Allies never break out:

| Objective | Historical | Runs holding it on 1 September | Median date held from |
| --- | --- | --- | --- |
| Cherbourg | 26 June | 18 of 19 | 17 June |
| Caen | 9 July | 6 of 19 | 24 August |
| St-Lô | 18 July | 15 of 19 | 20 August |
| Coutances | 28 July | 14 of 19 | 25 July |
| Avranches | 30 July | 7 of 19 | 10 August |
| Rennes | 4 August | 3 of 19 | 23 August |
| Falaise | 17 August | 7 of 19 | 12 August |
| Le Mans, Nantes, Orléans, Chartres, Paris, Brest | 8 August to 18 September | 0 of 19 | none |

Median losses were 322 Allied and 298 German battalion-equivalents. The Germans lose too few, because no front collapses and no pocket closes.

Changes for batch 2:

1. A German division holding a sector gives up its stand once it falls below 45 percent strength (`stayMinStr`), instead of holding to 16 August whatever its state.
2. From 1 August only Third Army runs under an AI army commander: Patton's rhythm, 24 to 30 hours between corps attacks, reaching about 32 km.
3. Divisions that served under Third Army fight with more dash (aggression .75).
4. The Mortain counterattack and the sourced H-Hours, which batch 1 did not have.

**Batch 2** could not run on GitHub: Actions stopped starting jobs on 23 November because the account's payment or spending limit was reached, after batch 1 used about 50 runner-hours. Two games with the batch 2 settings ran in Claude's workspace instead (seeds 201 and 202):

| Objective | Historical | Seed 201 | Seed 202 |
| --- | --- | --- | --- |
| Cherbourg | 26 June | 22 June | 1 August |
| Caen | 9 July | 21 August | not held |
| St-Lô | 18 July | 22 August | 14 August |
| Coutances | 28 July | 25 July | 6 August |
| Falaise | 17 August | 20 August | not held |
| Avranches | 30 July | 27 August | not held |
| Rennes and everything beyond | 4 August onward | none | none |

Seed 201 began to break out only after 22 August, when worn German divisions started giving up their sectors. The batch 2 changes are not enough. The Allied attacks cost more than the German defence (losses about 390 to 345 in seed 201), where history ran the other way by the end of August. The next work is the strength of the German divisions as they arrive (the templates give every infantry division its full establishment), the weight of Allied artillery and air in the bocage, and German supply under air interdiction.

**Changes for batch 3** (played in Claude's workspace while Actions is stopped):

1. *German Kampfgruppen.* The 265th, 266th, 275th and 353rd Divisions sent mobile Kampfgruppen of reinforced regiments to Normandy (Harrison p. 254), so each now enters as five battalions: three infantry, one artillery and one pioneer.
2. *Allied non-divisional support.* 73 units now wait in the Allied Support pool and land on their dates: four AGRAs of one heavy and three medium regiments each (Ellis I p. 537 gives the composition and the scale of one per corps plus one spare), eight armoured and tank brigades of three regiments each, and four 155mm battalions of corps artillery for each of seven US corps. Which AGRAs and brigades, and their landing dates, are general history to verify. The four battalions per US corps are a cautious reading of the corps field artillery groups (inference). The staff AI attaches pool units to divisions as before.

Single runs vary widely: Cherbourg came 24 June in run 4 and 15 June in run 5. The batches of 20 give the spread. After run 4 Cherbourg came within two days of history. Caen and St-Lô still fall weeks early. The causes found so far:

1. The panzer divisions at Caen are committed piecemeal as they arrive, as in history, but they lose their sectors faster than they did.
2. Bocage and town fighting may favor the defender too little at division scale.

Batches now run on GitHub Actions: `.github/workflows/ai-batch.yml` runs 20 seeds of the whole slice in parallel and commits a summary to `docs/tests/` (built by `tools/batch-summary.js`): for each objective, how many runs hold it at the end, the median date held from, and the spread.

**Batch 3 on GitHub Actions** (20 seeds, `docs/tests/batch-20261123-1722-batch3-support.md`): Cherbourg fell on a median date of 16 June (history 26 June), Caen 21 June (9 July), Coutances 26 July (28 July). Avranches fell in 9 of 20 runs, with a median of 18 August. Rennes fell in 3 of 20. Le Mans and Paris fell in none. Median losses were 198 Allied and 298 German battalion-equivalents. The breakout ran about three weeks late and Caen fell 18 days early.

**Faults found after batch 3:**

1. *Idle divisions.* The staff AI sent two divisions to each objective within 20 km, which left 19 Allied divisions idle. It now sends four per objective and looks out to 150 km (`aiPerVP`, `aiRng`).
2. *Planned moves ran late.* The scenario's dated AI moves were stretched by about 1.3, so August moves came weeks late. `aiExact` keeps the planned times.
3. *Army AI too fast.* With every army under the army AI, the Allies advanced far faster than history. The army AI now runs Third Army only, from 1 August.

A single run with these changes (`docs/tests/batch-20261123-1728-batch4-join.md`) took Avranches on 30 July and Rennes on 3 August, both within a day of history. Caen held until 18 August, 40 days late, and St-Lô fell 23 days early. 
**Batch 5** (20 seeds, `docs/tests/batch-20261123-2041-batch5-dates.md`): Avranches fell on a median date of 31 July (history 30 July) and Coutances on 25 July (28 July). Rennes fell in 15 of 20 runs, median 12 August. Le Mans and Chartres fell in none. Caen was held from a median date of 19 August and St-Lô from 10 August, although Allied troops first entered both in mid-June. Median losses were 222 Allied and 347 German battalion-equivalents.

**Faults found in batch 5, and the changes for batch 6** (label `batch6-phases`, running on GitHub Actions; it includes the pocket rule):

1. *Caen and St-Lô entered in June, then lost.* St-Lô stood open on 13 June because the 352nd Division stayed behind Omaha. The 352nd now falls back to the Elle on the night of 9/10 June, and a new AI phase line keeps the Allied staff north of St-Lô and Caen until 8 July.
2. *The 51st Division marched to Fécamp in June.* The eastern end of each phase line stopped short of the Channel coast. The lines now run to the map edge.
3. *Paris and Rouen reached in early August in some runs.* The German Fifteenth Army is outside the slice, so the lower Seine stood empty. Two more phase lines close the lower Seine until 19 August and Paris until 22 August.
4. *Third Army too slow after Avranches.* The army AI ordered each corps 32 km at most, once a day, and waited 48 hours on an attack. A scenario can now set pursuit values; Third Army reaches 90 km, plans every 12 hours and waits 24.

Carentan flipped on 6 June in every run, six days early, because the 101st Airborne landed beside it and the German 6th Parachute Regiment was missing from the order of battle. The regiment is now in `data/oob/german-1944.json` (Maj. von der Heydte, three battalions) and holds a 2.4 km line on the town. In six test seeds Carentan stayed German through the first 72 hours; in one eight-day run it fell on 13 June (history 12 June).

**Batch 6** (20 seeds, read from the game logs into `docs/tests/batch6-phases-from-logs.md`): Caen was held from a median date of 12 July (history 9 July; batch 5 gave 19 August) and St-Lô from 29 July (18 July). Avranches fell on 1 August and Rennes on 7 August in 18 of 20 runs. Le Mans fell in 6 of 20 runs, Orléans in 5 and Chartres in 5; batch 5 had none. No run reached Paris, and the early marches to Paris and Fécamp are gone. Median losses were 259 Allied and 381 German battalion-equivalents.

Still off after batch 6: Falaise falls 13 days early, Cherbourg 10 days early and Carentan on D-Day; St-Lô is 11 days late; the pursuit after 10 August is too slow for Paris. Batch 7 (label `batch7-theater`) adds the German theater commander and was running when this was written.

**Batch 7** (first German theater commander; 18 of 20 games finished when read, `docs/tests/batch7-theater-from-logs.md`): Caen was held from a median date of 9 July, the historical date. Avranches fell on 29 July and Rennes on 6 August in every game. Le Mans fell in all 18 games (median 15 August; batch 6 had 6 of 20), Chartres in 11 on 18 August, Orléans in 10 and Paris in 3 on 24 August. The commander's general withdrawal opens the pursuit that the fixed 16 August date had held back. Median losses were 248 Allied and 381 German battalion-equivalents.

Still off after batch 7: Falaise 13 days early, Cherbourg 11 days early, St-Lô 11 days late, and Brest taken in 4 games before 25 August. Since the player now commands the Allies, the Allied computer side is a test partner only, and its calendar may follow history closely. Four phase lines were added for batch 9: St-Lô opens on 3 July, the northern Cotentin on 19 June, the Falaise road on 8 August and Brest on 25 August. Batch 9 also carries the stronger commander, the 6th Parachute Regiment and the armored-infantry crossing rule.

## German theater commander

`engine/src/theater.js` gives the computer's side a high command (OB West in Overlord). Tov asked for it after learning that every German operational move was scripted. The scenario's historical destinations are now the commander's default plan, and he departs from it when the battle does:

1. An arriving division goes to another sector within 40 km when that sector is under at least three times the pressure it can bear and the planned sector is calm.
2. A mobile division whose planned sector has almost no enemy near it waits in reserve 14 km behind it. He commits reserves to the sector that needs them most.
3. With no reserve left and a sector in crisis, he moves a mobile division from a sector with no enemy in front of it.
4. A division with the enemy behind it in strength steps back 10 km and re-forms its line.
5. When eight or more enemy battalions stand 35 km beyond the front, the line is turned. Sixteen days later he orders a general withdrawal to the Seine. The fixed withdrawal date of 16 August is gone: Avranches fell on 30 to 31 July and the order came on 16 August (Blumenson p. 527), so the delay stands in for Hitler's refusal.

On 23 November Tov decided that the player commands the Allies only and that the German commander must be strong enough to give a fight. The campaign menu now offers the Allied side and the observer seat (`playerSides`). The commander gained four abilities:

6. An infantry division arriving in a sector that a mobile division holds takes over the line, and the mobile division goes into reserve.
7. A rested reserve counterattacks an objective that fell in the last 72 hours, when the enemy there is weaker than the division.
8. When enemy troops are loose behind the front, he sends a reserve, or a mobile division from a quiet sector, to block the next town on their road.
9. He knows only what his troops have seen in the last 48 hours, and he counts an enemy-held town near a sector as pressure on it.

He acts only on a side the computer plays. A replay of the first two weeks (seed 104) kept eight of nine committed divisions in their historical sectors; 2nd Panzer waited in reserve behind Caumont for three days and was then committed east of the Orne. All thresholds are game settings in `THEATER` and need calibration by batch.

## Railways and trains

- Railways now draw on the map as a ballast bed, sleepers and two rails (`engine/src/render.js`). They were not drawn before.
- A division moving by rail shows as a locomotive with a rake of troop cars that follows the track, with smoke while it runs and a label while it entrains or detrains. Divisions moving by road show as a string of vehicles or marching files (`engine/src/render3.js`, fed by `S.columnView` in `transport.js`). Tov asked for the tracks and the train.
- Screenshots: `docs/screenshots/step5-train-near.png` and `step5-train-mid.png`. They show a real move: the 5th Parachute Division, ordered from Brittany to Paris, 95 km along a 409 km rail route near Évron. In an ordinary game the German divisions mostly march or drive; of 23 divisions ordered on a long move at the start, two chose rail.
- Armored and motorized infantry can make an assault crossing: they leave their vehicles on the near bank, cross in the boats and fight on foot until a bridge is in. Tov found that the tutorial's armored division had no crossing button.

## Town names

The towns file joined the 1936 census to today's commune list, so communes merged after the war showed their new names (Carentan-les-Marais, Vire Normandie). `tools/data/town-names-1944.py` now takes each town's name in force on 6 June 1944 from INSEE's Code officiel géographique, "communes depuis 1943" (COG 2026, Licence Ouverte / Etalab), by the town's INSEE code. A merged commune keeps its former chief town's code, so that lookup gives the chief town's 1944 name. 225 of the 1,505 towns take a different name in 1944, 182 of them on the Overlord map. `tools/realmap.js` shows the 1944 name, and `towns.json` keeps today's name.

The hand list Claude wrote overnight agreed with INSEE on 31 of 35 names it shared. The four that differed came out as follows: Gennes-Val-de-Loire is Les Rosiers by its code, La Hague is Beaumont, Athis-Val de Rouvre is Athis, and Juvigny les Vallées is Juvigny. INSEE's names replace the hand list. Tov downloaded the file on his laptop through Chrome, and it now sits in `sources/insee/`.

## Screenshots

- `docs/screenshots/step5-overlord-beaches.png`: the opening view on 6 June, 1400 hours.
- `docs/screenshots/step5-overlord-theatre.png`: the theatre at the same hour.
- `docs/screenshots/step5-tutorial-tn.png`: the Tennessee tutorial with the chief umpire's first note.

## Still to do in step 5

1. Calibration, from the batch results.
2. Army group orders; columns and release points on the map; the player's air plan.
3. The other role levers (the theater airborne reserve, Fortitude, replacements), AI army commanders who issue corps orders in the manner of Montgomery and Bradley, and political events beyond the slice.
4. A listen-through of the Tennessee narration by Tov, and a batch that includes the pocket rule.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Allied divisions, arrival dates, corps | `data/oob/allied-1944.json`, `attachments-1944.json` (ETO order of battle; Ellis I) | US sourced; British and Canadian dates verify |
| German positions, arrival dates and destinations | `data/oob/german-1944.json` (Ellis I, Harrison, Blumenson) | 33 arrival dates sourced, 5 inference, 13 verify; destination points inference |
| Airborne times | Craven and Cate III p. 143 | Sourced |
| H-Hour times | Ellis I p. 143; Harrison p. 300 | Sourced |
| Naval forces by beach | General history | Verify |
| Mulberry B 16 June; storm 19 to 22 June | Ruppenthal I p. 406 | Sourced |
| Historical capture dates | Blumenson: Cherbourg p. 37, Avranches p. 316, Rennes p. 355, Nantes p. 367, Orléans p. 566, Paris p. 589, Brest garrison 18 September p. 651 | Sourced; Carentan, Caen, St-Lô, Coutances, Le Mans, Falaise, Chartres, Rouen verify |
| German withdrawal along the American front from 16 August | Blumenson p. 527 | Sourced (the game's hold date) |
| Cherbourg clearing time | General history | Verify against Ruppenthal ch. XI |
| 1,360 troop carriers; 319 German aircraft | Ellis I pp. 72-73, 566 | Sourced |
| CCS directive of 12 February 1944 (Eisenhower's order) | Harrison, *Cross-Channel Attack*, Appendix B, pp. 456-457 | Sourced |
| Second Army maneuvers in Tennessee, 1941 to 1944 | General history | Verify |
| 1944 town names | INSEE, Code officiel géographique 2026, communes depuis 1943, by INSEE code | Sourced |
| Tennessee town positions | Coordinates projected with pyproj (UTM 16N) | Sourced positions; roads and river course inference |
| Test results | `tools/scenario-overlord.js` runs, seed 12345 | Sourced |
| March rates, phase lines, fighting quality, objective points, supply rates | Claude's settings in `tools/scenario-overlord.js` | Inference (game settings) |
| Tennessee narration clips | Generated by Claude with Chatterbox from Tov's voice sample; texts in `docs/tutorial/tn-narration-clips.json` | Sourced (project files); wording is Claude's draft |
| Clip check | pocketsphinx transcripts and clip durations, run in Claude's workspace | Sourced; recognizer accuracy is low, so the result is an inference until Tov listens |
| Batch 3 and single-run results | `docs/tests/batch-20261123-1722-batch3-support.md`, `batch-20261123-1728-batch4-join.md` | Sourced |
| Causes of the late breakout | Claude's reading of the runs | Inference |
| Batch 5 results | `docs/tests/batch-20261123-2041-batch5-dates.md` | Sourced |
| 51st Division's march to Fécamp | Debug run, seed 104, 21 to 22 June | Sourced (test run) |
| 352nd Division to the Elle, 9/10 June | General history | Verify against Harrison ch. IX |
| Phase-line dates: 8 July, 19 August, 22 August | General history (Charnwood, Mantes, the order to take Paris) | Verify; the lines themselves are game settings (inference) |
| Third Army pursuit values | Claude's settings | Inference (game settings) |
| Theater commander rules and thresholds | `engine/src/theater.js`; Claude's design | Inference (game settings) |
| Two-week replay with the commander | `/tmp/th-run.js`, seed 104, 330 game hours, in Claude's workspace | Sourced (test run) |
| Sixteen-day delay before the general withdrawal | Blumenson p. 527 for 16 August; Avranches 30 to 31 July from Blumenson p. 316 | Sourced dates; the delay as a rule is an inference |
| Railway and train display | Screenshots in `docs/screenshots/`; test train placed by script | Sourced (test run); a real rail move on screen is still to be seen |
| Batch 6 results | 20 game logs of GitHub Actions run 45262652917, summarised with `tools/batch-summary.js` | Sourced |
| Player commands the Allies only | Tov, 23 November ("go") | Sourced (owner decision) |
| Commander abilities 6 to 9 | `engine/src/theater.js`; a 17-day replay (seed 104) ran without error and showed none of the new events, so relief, counterattack and blocking are untested in play | Inference (design); the test gap is stated |
| 6th Parachute Regiment: strength, commander, D-Day moves, withdrawal on 11 June | Harrison, Cross-Channel Attack, pp. 239, 297-298, 364 (OCR text in `sources/archive`; page numbers read from the OCR page markers) | Sourced; start position at Carentan is an inference |
| Carentan test | Six seeds, 72 game hours each, and one run of 200 hours (seed 104) | Sourced (test runs) |
| Real rail move on screen | Headless browser run: 5th Parachute Division ordered to Paris | Sourced (test run) |
| Dismounted crossing by armored infantry | General practice | Inference, to verify against FM 17-42 |
| Batch 7 results | 18 game logs of GitHub Actions run 45275561944 | Sourced; two games were still running |
| New phase-line dates (3 July, 19 June, 8 August, 25 August) | General history | Verify against Blumenson, Harrison and Ellis |

## Replacements

`engine/src/replace.js` (module `repl`), built on 23 November to the rule in the design document and the five effects Tov approved:

1. Each nation has a pool that fills at a daily rate. A battalion that has been out of fire for 12 hours, with no enemy within 4 km and a supply road open, draws men and regains up to 10 percent strength a day. Destroyed battalions are not rebuilt.
2. The new men are less experienced, so the battalion's experience becomes the blend of old and new. Its morale base moves with it.
3. Cohesion dips by half the share of the battalion that is new, and recovers with rest.
4. A battalion under fire gains experience slowly, to a ceiling of 1.35.
5. The division card shows Experience (Green, Trained, Experienced, Veteran) and the replacements taken in, and a division reports a day's intake.

Pools in Overlord, in battalion-equivalents of 800 men a day: US 2.8, British and Canadian 1.2, German 0.16. Replacement experience: US 0.85, British 0.9, German 0.8.

Test (seed 104, 15 days): the Allies lost 58 battalion-equivalents and took in 15; the Germans lost 64 and took in 2.4, or 4 percent. The 29th Division, refilled to full strength, fell from experience 0.90 to 0.87. The 21st Panzer Division, never out of the line, stood at 28 percent strength with experience up from 1.00 to 1.10.

Still to do: the player's replacement priority by army, and a batch with replacements in play (batch 10).

## Engine fixes from the Sarn Corridor build (24 November)

Tov asked for the fixes in `docs/engine-fixes-for-france-1944.md` of the sarn-corridor repository. The patch applied cleanly (`git apply --check` passed on commit 30ee1a1) and the three loader edits were made by hand.

- **Coastal pockets close.** Sea cells belong to no pocket. This changed the Market Garden and Sicily results; new baselines are recorded.
- **Front-line ground model.** Overlord sets `ownR: 3, ownMax: 15, isoShrinkKm: 12`, the document's suggested values.
- **Corps plans and army AI.** `corpsPlan` is available; Third Army's AI takes `frontKm: 4, pocketBonus: 2`.
- **Stop-the-clock options start off** and save under `f44_stop`.
- **Doctrine module** is on for Overlord, with one change from the document: `devKm` is 5 km in place of 15. At 15 km every division in the bridgehead moved across the bocage, and in a four-day test (seed 104) the Allies held no objective by 10 June. At 5 km they held Bayeux and Ouistreham, as before the patch.

**A fault in the page builder, found during this work.** `tools/build-preview.js` copied a fixed list of scenario settings into the single-file page, and the list lacked `armyAI`, `theater`, `repl` and `playerSides`. The France1944.html files sent on the evening of 23 November therefore ran without the German theater commander, without replacements and with all three seats on the menu; German reinforcements in those pages held their arrival positions. The batches on GitHub use the scenario directly and were unaffected. The builder now carries every scenario setting except the few it rebuilds, and a browser check confirmed the commander, the pools and the two-seat menu in the page. That check is now a tool, `tools/check-page.js`: it builds the page, opens it in headless Chrome, plays 30 game hours as the Allies and confirms that every scenario setting and every module is present and alive. Run it before any page goes to Tov.

## Fix 7 from the Sarn Corridor build, and the D-Day coastal sectors (24 November)

- Fix 7 applied from `engine-fixes-for-france-1944-fix7.patch`: at regiment zoom a label that would overlap one already drawn is skipped, and a division given `stretch: 1` with its starting line spreads along the whole line. `tools/regress.js` matched the baseline.
- Every German division in position on D-Day stood on a 10 km line with its battalions inside 4 to 8 km. Three now start on their coastal sectors, read from `position0606.sector` in `data/oob/german-1944.json`:
  - **352nd Division:** 41 km of coast from the Vire estuary to Asnelles. Before this change it stood in its assembly area 12 km inland, which was wrong for 6 June: it had taken over the left half of the 716th Division's sector by 19 March.
  - **716th Division:** 29 km from Asnelles to the east bank of the Orne.
  - **709th Division:** 35 km of the east coast of the Cotentin from the Carentan estuary to Barfleur.
- The 711th Division (east of the Orne) keeps its 10 km line; no source for its sector width was read. The 243rd and 91st Divisions were reserves in assembly areas and stay grouped.
- A line that crosses a river or runs over water is cut to the part on the division's own bank, so each sector line was checked point by point to lie on land.
- Screenshots: `docs/screenshots/step5-dday-theatre.png`, `-division.png`, `-regiment-calvados.png`, `-regiment-cotentin.png`.
- This puts the 352nd on Omaha and the 716th on Gold, Juno and Sword from the first hour, so the first days will play differently. Batch 12 tests it.

## Batches 9 to 11 compared (24 November)

| Objective | History | Batch 9 (stronger commander, new dates) | Batch 10 (plus replacements) | Batch 11 (plus Sarn Corridor engine fixes) |
| --- | --- | --- | --- | --- |
| Carentan | 12 Jun | 12 Jun | 12 Jun | 12 Jun |
| Cherbourg | 26 Jun | 20 Jun | 19 Jun | 19 Jun |
| Caen | 9 Jul | 28 Jul | 27 Jul | 24 Jul |
| Saint-Lô | 18 Jul | 4 Jul | 3 Jul | 4 Jul |
| Avranches | 30 Jul | 1 Aug | 1 Aug | 1 Aug |
| Rennes | 4 Aug | 6 Aug | 7 Aug | 12 Aug |
| Le Mans | 8 Aug | 21 Aug (16 of 20) | 15 Aug (17) | 18 Aug (12) |
| Falaise | 17 Aug | 12 Aug | 10 Aug | 11 Aug |
| Chartres | 18 Aug | 16 Aug (10) | 16 Aug (14) | never |
| Paris | 25 Aug | 24 Aug (3) | 29 Aug (3) | never |

Findings: replacements gave the best pursuit; the engine fixes stalled it; Caen came two to three weeks late; Saint-Lô, Cherbourg and Falaise fell within a day or two of the date the Allied staff was allowed to attack them.

**Caen, game by game.** In batches 9 to 11 Allied troops first entered Caen in June in 37 of 60 games and held it at once in only 12. The town changed hands for weeks: one battalion within 1.2 km of the centre, with no enemy that close, took it. A new setting, `capBig { pts: 20, r: 2.5 }`, makes the 20-point towns change hands only when the holder has no troops within 2.5 km.

**Tests started.** Batch 12 (coastal sectors, doctrine on), batch 13 (the same with the doctrine module off, through the workflow's new `disable` input) and batch 14 (batch 13 plus `capBig`). Twelve against thirteen isolates doctrine; thirteen against fourteen isolates the capture rule.

## Town and city fighting (24 November)

Design note: `docs/design/town-and-city-fighting.md`. Tov set the rules (a unit in the town; districts for cities; infantry assault with armor in support) and asked for two corps rules to be added and the note implemented. `engine/src/urban.js` (module `urban`) and changes in `sim.js` and `command.js` carry it out:

- A town with a built-up area changes hands when troops stand in it and no formed defender does. 58 of Overlord's 383 objectives qualify.
- Caen is two objectives (Caen on the north bank, Vaucelles on the south) and Cherbourg two (the city, and the arsenal, whose fall opens the port).
- Tanks firing into a town without infantry beside them lose effect; infantry with tanks beside them gain; infantry at close range in a town hit tanks hard.
- An armored division ordered alone into an enemy-held town says so and obeys.
- A corps commander whose objective crosses an enemy-held town holds his armored division in reserve, or moves the boundary so infantry takes the town.

On 24 November Tov asked for the doctrine module and the town rules in the Tennessee tutorial as well. `tutorial-tn` now loads `doctrine` (development at 4 km) and `urban` (a town needs two built-up cells), and its baseline was recorded again. In a test (seed 7) a II Corps order across Hartsville put both infantry divisions forward and the 1st Armored Division in reserve, with the report "Hartsville is infantry work"; Blue held Hartsville after 48 hours. The narration does not yet mention these rules.

Tests: the corps rules and the general's warning were checked on the tutorial corps with the module switched on for the test; a 17-day Overlord game (seed 104) ran without error; the page check passes with eight modules. No Overlord corps had three divisions and an armored one ashore by 22 June, so the corps rules have not yet fired in a campaign game. In that game Saint-Lô, La Haye-du-Puits and Périers were Allied by 22 June, weeks early; batch 12 will show whether the coastal sectors cause that. Batch 15 runs this module with doctrine off, for comparison with batch 14.

## Source checks made on 23 November

Read in the OCR texts in `sources/archive`. The OCR drops most page headers, so page numbers are given only where a page marker was legible.

| Game setting | What the source says | Source | Status |
| --- | --- | --- | --- |
| 352nd Division falls back to the Elle, 9/10 June | At about 1900 on 9 June Kraiss was ordered to withdraw to the Elle from Bérigny to Airel, the move to be complete by 0600 on 10 June; he had 2,500 men for about ten miles | Harrison, Cross-Channel Attack, V Corps chapter | Sourced; page to be read from the printed book |
| St-Lô opens to the Allied staff on 3 July | First Army's attack was to start on 3 July; the artillery preparation began at 0515 | Blumenson, Breakout and Pursuit, pp. 38 and 58-59 | Sourced |
| Northern Cotentin opens on 19 June | Map titles: "Attack to Cut the Peninsula, 10-18 June 1944" and "The Advance North, 19-21 June 1944" | Harrison, list of maps XXI and XXII | Sourced |
| Caen opens on 8 July | Map title: "British attack 8th and 9th July" | Ellis, Victory in the West, vol. I | Sourced; page not legible |
| Falaise road opens on 8 August | "Totalize" indexed at pp. 419-432; the text describes its first day | Ellis vol. I, index | Sourced for the operation; the date 8 August still to be read on p. 419 |
| Lower Seine opens on 19 August | XV Corps "moved easily to Mantes-Gassicourt on 18 August" | Blumenson, Drive to the Seine chapter | Sourced; the game uses 19 August, one day later (inference) |
| Paris opens on 22 August | Map title: "Liberation of Paris, 23-25 August 1944" | Blumenson, list of maps XIII | Sourced for the 23rd; the order on 22 August is still to verify |
| Brest opens on 25 August | Map title: "Battle for Brest, 25 August-18 September 1944" | Blumenson, list of maps XIV | Sourced |
| US replacement rate | More than 200,000 replacements planned for the Continent in the first ninety days | Ruppenthal, Logistical Support of the Armies, vol. I, replacement plan (page near 299-305, to confirm) | Sourced for the plan; actual deliveries not checked |
| German replacement rate | 5,210 replacements against about 87,000 casualties by mid-July, 6 percent | Blumenson pp. 181-182 | Sourced |
| British rate, all experience levels, rest and absorption rules | Claude's settings | Inference |
| Engine fixes applied | `docs/engine-fixes-for-france-1944.md` and its patch in tovbrog-pixel/sarn-corridor, written by Tov's Sarn Corridor build | Sourced |
| devKm 5 for Overlord | Five four-day test games, seed 104 (15, 5 and 2 km; module off; ground model off) | Sourced (test runs); one seed only |
| Page-builder fault and its repair | `tools/build-preview.js`; headless browser check of the rebuilt page | Sourced (code and test run) |
| 352nd took over the left half of the 716th's sector by 19 March; 726th Regiment attached | Harrison, Cross-Channel Attack, p. 257 | Sourced |
| 352nd sector a thirty-mile front; 716th six battalions under one regimental headquarters; 709th coast two and a half times as long, eleven battalions in three regiments | Harrison, ch. VII (German Defense Measures) | Sourced; pages not legible in the OCR |
| 709th held the east coast of the Cotentin | Harrison p. 147 (already cited in the order of battle file) | Sourced |
| End points and exact course of each sector line; leaving the 709th's north coast unmanned | Claude's placement | Inference |
| Batches 9 to 11 | `docs/tests/batch-20261124-0601-batch9-commander2-phases.md`, `-0830-batch10-replacements.md`, `-1102-batch11-engine-fixes.md` and their run files | Sourced |
| Caen entered and re-lost | The `took` and `held` dates in the 60 run files | Sourced; that one battalion can flip the town is read from the capture code (sourced), and that this explains the late dates is an inference |

## Source checks made on 24 November

Read in the OCR texts in `sources/archive`. Page numbers come from the nearest legible page marker and may be one page off.

| Item in the game | What the source says | Source | Status |
| --- | --- | --- | --- |
| Carentan, 12 June | Map title: "Battle for Carentan and Junction of the Beachheads, 8-12 June 1944" | Harrison, map XVI | Sourced |
| Saint-Lô, 18 July | Map title: "The Battle of St. Lo, 11-18 July 1944". Ellis: on the 18th "the first American troops were entering St. Lô" and on the 19th the town was fully occupied | Blumenson, map III; Ellis vol. I p. 348 | Sourced |
| Coutances, 28 July | 4th Armored Division troops "worked through the night of 28 July to clear the scattered enemy troops in Coutances" | Blumenson p. 315 | Sourced |
| Le Mans, 8 August | The 79th Division "reached the center of le Mans, by 1700 on 8 August"; the 90th entered next morning | Blumenson pp. 437-438 | Sourced |
| Chartres, 18 August | CCB, 7th Armored Division, reached the outskirts on the evening of 15 August and attacked on the 16th and 17th; the 11th Infantry attacked on 18 August | Blumenson pp. 570-571 | Sourced for the fighting of 15 to 18 August; the hour the town was clear was not read |
| Falaise, 17 August | Map title: "Capture of Falaise, 7th to 16th August" | Ellis vol. I, list of maps | The source gives 16 August; the game uses the 17th, when the town was clear (general history). Left unchanged and flagged |
| Falaise road opens 8 August | The same map title starts the operation on 7 August; Totalize opened that night | Ellis vol. I, list of maps; index pp. 419-432 | Sourced; the game's 8 August is the first full day (inference) |
| Mortain counterattack, night of 6/7 August | The panzer divisions were "assembled in the area east of Mortain by 6 August"; map title "German Counterattack at Mortain, 7 August 1944" | Blumenson p. 423 and map X | Sourced |
| Paris opens 22 August | Gerow "telephoned Leclerc on the evening of 22 August and told him to start marching immediately" | Blumenson p. 607 | Sourced |
| Cherbourg port opens 456 hours after capture | The port "could not begin operations until 16 July, a full three weeks after its capture" | Ruppenthal vol. I p. 464 | Sourced; 26-27 June to 16 July is 19 to 20 days, and the game uses 19 |
| Rouen, 30 August | Not found in the OCR of Ellis vol. I | | Still to verify |

Still unverified after this pass: Rouen; naval forces by beach; the AGRA and armoured brigade dates; 13 German arrival dates; the British replacement rate; the Tennessee maneuver dates; armored infantry crossing practice.
| Town and city rules | Tov, 24 November; `docs/design/town-and-city-fighting.md` | Sourced (owner decisions); every number is an inference |
| Corps rule tests | Tutorial corps with the module on, seed 7 | Sourced (test run) |

## Tutorial playtest fixes (24 November 2026)

Tov Binyamin Brog. Source: project doc `claude/France_1944_Tutorial_Playtest_Fixes.md`, a full playthrough of Exercise Cumberland at commit 6adc01a. Commits a8a59d5 to d0304af. A headless replay of the played plan (`tools/tutorial-run.js 79 48 south`, at 6adc01a) gave the same result as the playtest: Red 50, Blue 30, Carthage the only town taken.

### Item status

| Item | Status | What the code showed |
| --- | --- | --- |
| A1 | Fixed | Cause as stated. The armored division is the reserve when the corps route meets the river with no bridge in our hands, or an enemy town lies within 4 km beyond the line. Added: an armored commander no longer leaves reserve for an enemy town on his own initiative (Keller did so at 1037 in replay). |
| A2 | Fixed | Two causes. The lanes had no crossing check. Most reports came from the corps review: it committed the reserve to a stalled sector every two hours for 48 hours, and each relief crossed the relieved division. Now a stalled sector is relieved once, the relieved division rests in place, and lanes that cross change sectors. |
| A3 | Fixed | The card warning and the order itself both counted the corps' own divisions. |
| A4 | Fixed; inference half right | The corps order does pass the card's On arrival choice to each division. Selecting a division loads its last instruction into the card, so a corps order drawn from a division Ames had stood down carried Rest and refit to the corps. Order the whole corps now starts from Hold. |
| A5 | Fixed (attachment); marching left alone | `S.attach` raised capacity and added no stock: 4 points per battalion with the clock stopped. Marching costs about 0.7 points an hour (rations, fuel). The fall to 53 percent appears in seed 7 between hours 3 and 6, when the guns fire and the battalions refill ammunition. |
| A6 | Fixed | The corps put the armored reserve's assembly area on the river bank near Rome by geometry alone. The area now lies behind the corps centre on our side of the river. The report states whether the river or the ground bars the way. |
| B1 to B4, B6 | Fixed (one commit; the script is one line of JSON) | Texts below. |
| B5 | Fixed | Four boxes on by default in a tutorial; stored `f44_stop` stays in charge. In the page test the clock stopped at 0727 on a cut-off report. |
| C1 to C6 | Fixed | C6: replacements now reach toasts and hints, with formation and commander names set aside so "Parachute Regiment" keeps its name. |
| D1, D3 | Fixed | The panel keeps one size (540 by 340), the note scrolls, Back and Next stay put, default dock lower right with the card shortened above it. |
| D2 | Fixed | Division and regiment symbols show the formation. |
| D4 | Partly fixed | Town names move off symbols and depots, unit names off town names, rings share one label, the drop zone name avoids towns. The Lebanon name still sits close to the depot flag at the opening zoom. |
| D5 | Left alone; inference contradicted | Interdiction strikes enemy units and enemy supply columns only (`sim.js`, flight attack code, `e.s === es`). Blue troops in a zone are not hit. Step 12 is unchanged. |

One change beyond the list: step 8 now ends the corps line in Carthage, over the Cordell Hull bridge. With the line drawn "to the river", the right-hand division's sector lay on the south bank and it stood idle; after A1 Carthage then fell at hour 40 or never in three seeds. With the line in Carthage it fell at hour 6.5 to 8 in five seeds. The old clip texts are in git if Tov prefers the old wording.

### Tests

1. `tools/regress.js`: `sicily` and `tutorial` changed (attachment supply, crossing rule); baseline re-recorded at d0304af.
2. `tools/test-command.js`: Falaise corps and army cases as before; six new Cumberland cases (A1 reserve, A2 jumbled starts) pass on seeds 7 and 79.
3. Five seeds, umpire's plan to the letter (steps 5, 6, 8, 10, 12, 13 as now written, then the step 7 follow-up: the armored division west to Dixon Springs once the bridge is ours):

| Seed | Points Blue-Red | Losses Blue / Red | Blue towns | Carthage fell | 1st Division in contact |
| --- | --- | --- | --- | --- | --- |
| 79 | 30-50 | 4.6 / 8.5 | Carthage, Lebanon | hour 6.5 | hour 16 |
| 7 | 30-50 | 8.1 / 11.5 | Carthage, Lebanon | hour 7 | hour 3.5 |
| 11 | 30-50 | 9.0 / 9.5 | Carthage, Lebanon | hour 7.5 | hour 14 |
| 23 | 30-50 | 7.9 / 8.3 | Carthage, Lebanon | hour 6.5 | hour 19.5 |
| 101 | 30-50 | 6.6 / 7.4 | Carthage, Lebanon | hour 7 | hour 21 |

Target missed: no win or draw in five. B1's test also fails on four seeds. Two causes, both balance and outside this fix list. The 1st Division's leading battalions come under shellfire about 4 km from Hartsville from hour 3, lose cohesion in column, fall back and try again for 10 hours or more with the card reading Advancing and no report. At Carthage three Blue divisions attack the Red 1st Division for 36 hours at 1 to 3 percent loss per attack and never break out to Dixon Springs.
4. `tools/check-page.js`: all checks pass.
5. Tutorial page built with `VOICE_DIR=engine/voice`; page test in headless Chrome passes (no errors, panel fixed, hints, hover note, clock stops).
6. Overlord batch 18 queued on GitHub Actions at d0304af (run 45477920985).

### New narration (ten clips to record)

- t03_0: Click a Blue division, or a name in the Forces list. The card shows the general, his aggression and skill, and five bars: strength, cohesion, disruption, morale and supply.
- t04_0: Select the First Infantry Division at Lebanon. Press Draw line of advance, then drag from the division up the main road, over Hartsville bridge, and stop in Hartsville on the north bank. Then press Issue order.
- t04_1: This is the fixing attack, and a fixing attack has to touch the enemy. A division that halts short of the river pins nobody.
- t07_1: Select the Second Infantry Division, and press Order the whole corps. Then draw one line of advance from Watertown, over the Cordell Hull bridge, into Carthage, and issue it.
- t07_2: General Ames takes about an hour to plan. He splits your objective line among his divisions, and holds one back as his reserve.
- t07_3: A town is infantry work, and so is a river crossing. Carthage stands just across the river, so he sends the two infantry divisions forward, and keeps the armored division back for the exploitation.
- t07_4: Once the attack starts, he commits the reserve where a division is worn out. Use a corps order for a broad attack, and a division order for a single task.
- t09_0: Open the Support tab. These battalions belong to you until you give them to a division. Select a division first. Then press D S, direct support, for an artillery battalion, and Attach for any other.
- t09_1: I recommend the heavy artillery battalion in direct support of the First Infantry Division, and the engineers attached to the same division. Hartsville bridge is wired, and Red will probably blow it.
- t12_0: Select the Parachute Regiment. Its lift is planned for fourteen hundred, onto the Riddleton road east of Dixon Springs, to block the Red reserve. Friction usually makes it later. The card shows the hour the staff expects.

Kept clips renumbered: t04_1 to t04_2, t04_2 to t04_3. Until the ten are recorded the page reads those steps with the browser's own voice.

### Port to Sarn Corridor

- `command.js`: A1 reserve rule (`riverBars`, town beyond the line), A2 lanes, reserve area, single relief, `S.leaveCorpsOrder`, A3 `sisters`.
- `sim.js`: A1 initiative rule, A3 `S.crossings(F, P, skip)`, A5 `S.attach` stock, A6 report text.
- `ui.js`: A3 `crossOf`, A4 Hold on corps mode, B5 `stopDefaults`, C1 to C6 (`tutD`, `rankOf`, hint lines, `sc.tutPlan`), D1 to D3 panel, D2 hover note.
- `render3.js`, `index.tpl.html`: D1 to D4.

### Source trace

| Change | File and place | Basis |
| --- | --- | --- |
| A1 | `command.js` `planCommandOrder` (river, beyond, note); `sim.js` initiative rule | Code read; observed in replay seeds 7, 79 |
| A2 | `command.js` `lane`, `xPoly`, reserve block, `review`; `ui.js` `runCmd` issue | Observed in replay log (relief every 2 h); code |
| A3 | `ui.js` `crossOf`; `sim.js` `S.crossings`, `issueOrder`; `command.js` `release` | Code |
| A4 | `ui.js` corps mode handler; `select` and `command.js` `send` read | Code; mechanism of the playtest sighting is an inference |
| A5 | `sim.js` `S.attach` | Observed: 70, 66, 62 percent before; 70, 70, 70 after. Seed 7 ammunition cause is an inference from the curve |
| A6 | `command.js` reserve block; `sim.js` `bridging` | Observed in replay (reserve at Rome, grid 29-19); code |
| B1 to B6 | `tutorial.js` `tutScript` steps 4, 5, 8, 10, 13; `ui.js` `stopDefaults` | Fix list; engine arrival formula for B4 (`sim.js` line 82: 20 to 140 minutes late) |
| Step 8 line into Carthage | `tutorial.js` step 8 | Observed, three seeds each way; Claude's addition |
| C1 to C6 | `ui.js` toast, `tutAdvice`, `tutD`, `rankOf`; `tutorial.js` `tutPlan` | Code; page test |
| D1 to D4 | `index.tpl.html` `#tut` rules; `ui.js` `tutDraw`, `hover`; `render3.js` labels, hits | Page test and screenshot at 1600 by 1000; other screen sizes untested |
| D5 | none | Code |
| Five-seed results | `tools/tutorial-run.js` | Observed |

### Balance follow-up (24 November 2026, after Tov's go-ahead)

Two causes found and fixed; one trial dropped.

| Change | File | Basis |
| --- | --- | --- |
| Red 2nd Division's hold line follows the north bank. Drawn straight it crossed the river twice and nine units stood on one cell at the Hartsville bridge. | `tutorial.js` forms | Observed (unit positions at hour 2) |
| A division in contact paces its advance by the rear quarter of its leading battalions. Before, the rearmost single battalion set the pace: one battalion on a far flank or behind a bend in the route froze the division. At Carthage the 2nd Infantry and 1st Armored stood at the same progress from hour 12 to hour 48 with the status Assaulting. | `sim.js` formation advance (`minP`) | Observed (progress 17.6 of 23.7 km at hours 12, 24, 40). Port to Sarn Corridor. That this also slows the Overlord pursuit is an inference; batch 19 tests it. |
| Trial dropped: starting development from the leading battalions or from shellfire. First contact came later (hour 24). | `doctrine.js`, reverted | Observed, three seeds |

Five seeds after both fixes, same plan: 79 Blue 50-30, 7 Blue 50-30, 11 Blue 50-30, 23 Blue 80-0, 101 Blue 60-20. Blue wins five of five. Carthage falls at hour 6.5 to 7.5. The ten narration clips are recorded (58 in all).

## Fix 8 from Sarn Corridor (24 November 2026)

Tov Binyamin Brog. Source: `docs/engine-fixes-for-france-1944.md` (version 5) and `engine-fixes-for-france-1944-fix8.patch` in tovbrog-pixel/sarn-corridor at a2131e8. Applied to a8c8ed4 with `git apply`; the check passed.

| Step | Result | Basis |
| --- | --- | --- |
| Patch | Seven files changed: `command.js`, `doctrine.js`, `map.js`, `render.js`, `render3.js`, `sim.js`, `transport.js` | Observed |
| `tools/regress.js` | salerno, marketgarden, bastogne, falaise, gazala and sicily changed; tutorial, tutorial-tn and one more matched, as the document predicts. Baselines recorded. | Observed |
| `tools/test-command.js` | All A1 and A2 cases pass with no route crossings. The reserve in the Bellwood case is 2nd Infantry Division here; the document says 3rd. | Observed |
| `tools/tutorial-run.js`, five seeds | 79: 50-30; 7: 50-30; 11: 80-0 (50-30 before); 23: 80-0; 101: 60-20. Blue wins five of five. | Observed |
| `tools/test-transport2.js` | Rail case objective moved from y 64 to y 84, so the train unloads at 97,90, outside the 15 km limit. Plan: rail, 72.5 km. | Observed |
| `tools/check-page.js` | All checks pass | Observed |
| Batch 25 | Queued on GitHub Actions to compare with batch 19 | Pending |

The relief rule of fix 8 (commit the reserve only for a spent or lost division, 24 hours of rest) replaces the relieve-once rule of fix A2.

## Pursuit investigation (25 November 2026)

Tov Binyamin Brog. Two traced games of seed 3 to 20 August, front line on and off (`F44_TRACE`, `F44_TRACE2` in `tools/scenario-overlord.js`).

| Finding | Basis |
| --- | --- |
| Supply is cleared as the cause. Mean Allied supply ran 63 to 74 percent in both games, with none to two divisions cut off on any day. My guess that the front line starved the spearheads was wrong. | Observed, daily trace |
| The Granville objective stood in the sea, 13 km from land on this map. No route reached it from Avranches or Coutances. | Observed (`F44_VP=Granville`) |
| Third Army's commander sent corps at Granville again and again: 42 corps-readings of 91 with the front on, 73 of 133 with it off, 1 to 19 August. Division statuses read "Awaiting orders" 154 times against "Advancing" 78 (front on). | Observed, twice-daily trace |
| Fix: sea objectives move to the nearest land within 20 km (Granville 13 km, Fouesnant 1 km); the army commander sets an unreachable objective aside for ten days. | `tools/scenario-overlord.js` `landObjectives`; `command.js` `armyTick`. Port the `armyTick` guard to Sarn Corridor. |
| Open: why the front line costs the pursuit. With it off, Allied objectives rose from 123 to 175 between 13 and 19 August; with it on, from 108 to 119. Batches 26 (fix) and 27 (fix, front off) retest it without the Granville waste. | Observed; cause unknown |
| 37 other objectives stand on river cells, 1 km from land. They are captured normally (Rennes, Le Mans). Left alone. | Observed (`F44_VP=sea`) |

Follow-up, 10:50 AM ET: in the two seed 3 traces, leaving Granville out, the corps objective stood "on our ground" (the pocket bonus doubles its score) in 21 of 53 readings with the front line on and 10 of 60 with it off. Inference: the front line marks bypassed German-held towns as standing on Allied ground, so the bonus pulls corps back to them. Batch 28 (Granville fix, pocket bonus off, front line on) tests it.

## Front line off for Overlord; pocket bonus narrowed (25 November 2026)

Tov's decision after batches 25 to 28 (`docs/tests/batches-25-to-28-comparison.md`).

| Change | Where | Basis |
| --- | --- | --- |
| The front line between the two sides' nearest troops (`ownMax: 15`) is removed from the Overlord scenario. `F44_ON=front` restores it for a test. | `tools/scenario-overlord.js` | Observed in three batch pairs (17, 20, 27): Chartres 19 of 20 without it, 11 of 19 with. What it does to the pursuit beyond the pocket bonus is unknown. Sarn Corridor keeps it. |
| The army commander's pocket bonus applies only to an enemy-held objective on our ground with our ground at eight points on an 8 km ring (`pocketRingKm`). | `command.js` `pocketed`. Port to Sarn Corridor. | Batch 28: bonus off gave Chartres 14 of 19 against 11. The ring test is a design choice (inference); batch 29 tests both changes. |

## 26 November 2026: batch 29, a crash, and the first look at Paris

| Item | Result | Basis |
| --- | --- | --- |
| Batch 29 (front line off, narrowed pocket bonus) | Chartres 18 of 19, Orléans 8, Nantes 10, Rouen 10, Paris 2; losses 162 / 377. Matches batch 27. | Observed, committed summary |
| Game missing from each batch | Seed 119 crashed on 9 August in the corps review: a relieved division with no leading battalion left has no position (`pos` returns nothing). Came in with fix A2 on 24 November. Fixed in `command.js`; the workflow now fails a crashed game's job and keeps its log. A local rerun of seed 119 passed 9 August and ran to 12 August. | Observed (job log, rerun). That the six earlier misses were the same crash is an inference. |
| Paris is open all game | The phase line that runs to 22 August closes only ground east of x 526 to 530. Paris stands at x 522. | Read from `S.phaseBlock` and the scenario's phase lines |
| Paris is never entered | In 17 of 19 games of batch 29 no Allied unit enters Paris, though Chartres is held from 7 to 21 August. | Observed, job logs |
| Third Army turns back | Traced game, seed 101, 13 to 30 August: the four corps stand around x 270 to 420, y 70 to 120 (Normandy and the lower Seine) and are sent at Flers, Littry, Caen, Vaucelles, Bolbec, Le Havre and Fécamp. No corps is within 90 km of Paris, the commander's reach. Many divisions read "Awaiting orders" for days after their corps has its order; VIII Corps holds seven divisions, among them the 82nd and 101st Airborne. | Observed (`F44_TRACE2=68`) |
| Cause of the turn-back | The commander scores an objective by points over distance from the corps, with no sense of direction, and measures from the centre of all the corps' divisions, idle ones in the rear included. | Read from `armyTick`; that this is the whole cause is an inference |
| Open | Who takes Chartres on 7 August, 200 km from Avranches a week after Third Army starts, and why divisions wait for orders their corps already has. | Not examined |

## Mission axis for Third Army (26 November 2026)

Tov's choice among four options. `armyAI.axis` in the Overlord scenario: VIII Corps west and south into Brittany (`[-1, .5]`), the other corps east (`[1, 0]`). The army commander places each corps by the forward half of its divisions along the axis; an objective ahead scores up to 1.5 times, one behind 0.25 times, and a real pocket keeps its bonus. `F44_OFF=axis` removes it for a test. Engine part in `command.js` `armyTick` acts only where a scenario sets an axis; port to Sarn Corridor with the shared engine.

| Item | Basis |
| --- | --- |
| Third Army's two directions | General history (Blumenson, Breakout and Pursuit), to verify |
| Gain 0.5, behind 0.25, forward half | Starting values (inference); batch 30 tests them against batch 29 |

## Batch 30 and the Paris check (26 November 2026)

| Item | Result | Basis |
| --- | --- | --- |
| Batch 30, mission axis, 20 of 20 games (no crash) | Against batch 29: Orléans 17 of 20 (8 of 19), Paris 5 (2), Le Mans 19 (16), Chartres 16 (18), Nantes 11 (10), Rouen 9 (10), Brest 2 (1). Losses 169 / 379 (162 / 377). Normandy dates unchanged. | Observed, committed summaries |
| Decision | Tov: accept the Allied AI at about this level and move to the German side. A human player takes Paris himself. | Tov, 26 November |
| Paris under a direct order | Seed 101 with `F44_PARIS=70`: XII Corps ordered into Paris on 15 August from 225 km; Paris Allied on 19 August. | Observed |
| Paris has no garrison | No German unit stood within 15 km of Paris on any day from 15 to 30 August in that game. | Observed. This belongs to the German defence work and the city-defence note. |
| Odd positions | The 35th Infantry Division read 238 km from Paris and "Awaiting orders" on most days, 3 km on 19 August, and 238 km again on the 20th. The 4th Armored read 214 km on the 15th and 24 km on the 16th. | Observed; cause not examined. Either the trace reads a stale position for a division in transit, or divisions are being moved back. |
| Northern Cotentin watch | My box for `F44_ZONE` used raw data coordinates and showed the Caumont area; map coordinates differ. To redo. In that game Saint-Lô was held from 15 June and Caen first entered on 6 June. | Observed |

## German defence of Cherbourg (26 November 2026)

| Finding or change | Basis |
| --- | --- |
| Before: on 17 to 19 June the German 77th, 709th, 91st and 243rd Divisions stood dug in across the middle of the peninsula (map grid 253-59, 261-57). No German unit stood near Cherbourg. Nine or more Allied divisions waited in the north of the peninsula, the British 7th Armoured and 6th Airborne among them, and the 2nd Infantry Division was "near Cherbourg" twelve hours after the calendar opened it. | Observed, seed 101, `F44_ZONE` |
| Change: those four divisions fall back to a Cherbourg land front, a 16 km line about 7 km south of the port, from 17 June. | `tools/scenario-overlord.js` `GFALL`, `QL`, `Q.cherbourg`. Harrison, Cross-Channel Attack, "Advance to the Cherbourg Landfront": von Schlieben had the order to withdraw on the fortress; the defence stood on the ring of hills to a depth of about five miles. The line's place and the date of 17 June (history: the cut came on 18 June, general history) are game settings. |
| Change: a Cherbourg fortress garrison of two battalions holds the port from D-Day. | `data/oob/german-1944.json`, `ge-festung-cherbourg`. Harrison gives 25,000 to 40,000 enemy in the peninsula on 19 June including Flak, naval and Organization Todt men. Two battalions and the unnamed commander are inferences. |
| After, one game: the 77th and 709th are dug in at map grid 235-49 and 239-53 by 18 to 19 June; the garrison is last seen on 23 June. | Observed, seed 101. Batch 31 gives the Cherbourg date over 20 games. |
| Left alone: British divisions in the Cotentin. That is the Allied AI, accepted at its present level. | Tov's decision, 26 November |

## A division in a road or rail column was landed again at its first beach (26 November 2026)

The oddity in the Paris check, explained. Traced with `F44_FORM="35th Infantry,69,77"`, seed 101.

| Finding | Basis |
| --- | --- |
| The arrival loop in `sim.js` activates any formation that has an arrival record and is off the map. A division forming a road or rail column is taken off the map, so the loop landed it again at its first beach or entry point at once: "Moving by road on foot, 80 km" and "Ashore grid 292-78" in the same minute, with all 19 units back at 290,80. | Observed in the trace; read from `arrivals` and `transport.js` line 115 |
| On 19 August the 35th Infantry held Paris. Its next order was a truck move of 68 km. It was back at Omaha beach, 238 km away, that minute, and re-planned a road move every four and a half hours for three days without leaving. | Observed |
| The fault has been in the engine since the transport module (step 3). It touches every division that arrived by sea, air or road on either side, whenever its commander chose a road or rail move. The transport tests used the Falaise scenario, whose divisions start on the map. | Read from `git log`; the reach is an inference |
| Fix: the arrival loop skips a formation in a column (`!F.transit`). | `sim.js` `arrivals`. Port to Sarn Corridor: its copy has the same line. |
| Test: `tools/test-transit-arrival.js` forms columns for three Allied divisions on D+12. Without the fix all three are landed again with 20 units back at the beach; with it all three stay in the column. | Observed, both ways |
| Consequence | Every Overlord batch so far ran with this fault. Third Army's turn back to Normandy and the divisions "Awaiting orders" are probably this, and the Allied AI may be much better than batches 26 to 30 showed. Batch 32 measures it. |

## Batches 31 and 32 (26 November 2026)

Runs holding the objective at the end, and the median date held from. 20 games each.

| Objective | Historical | 30 mission axis | 31 and Cherbourg defence | 32 and transit fix |
| --- | --- | --- | --- | --- |
| Cherbourg | 06-26 | 20, 06-19 | 20, 06-19 | 20, 06-19 |
| Caen | 07-09 | 20, 07-09 | 20, 07-08 | 17, 07-11 |
| Saint-Lô | 07-18 | 20, 07-03 | 20, 07-03 | 19, 07-03 |
| Avranches | 07-30 | 20, 07-27 | 20, 07-27 | 18, 07-27 |
| Rennes | 08-04 | 20, 08-04 | 20, 08-04 | 19, 08-04 |
| Le Mans | 08-08 | 19, 08-13 | 19, 08-14 | 20, 08-13 |
| Nantes | 08-12 | 11, 08-17 | 15, 08-12 | 19, 08-11 |
| Orléans | 08-16 | 17, 08-16 | 19, 08-17 | 20, 08-11 |
| Falaise | 08-17 | 19, 08-08 | 17, 08-09 | 18, 08-09 |
| Chartres | 08-18 | 16, 08-08 | 16, 08-09 | 19, 08-10 |
| Paris | 08-25 | 5, 08-28 | 7, 08-27 | 12, 08-25 |
| Rouen | 08-30 | 9, 08-25 | 8, 08-26 | 4, 08-24 |
| Brest | 09-19 | 2, 08-28 | 0 | 8, 08-28 |
| Median losses, Allied / German | | 169 / 379 | 178 / 362 | 162 / 355 |

The Cherbourg defence did not move the date: Cherbourg is held from 19 June in every game of both batches. In the one traced game the garrison stood at 38 percent on 17 June, before the calendar opened the north, and by the 18th had left the port for map grid 232-38, more than 5 km away. What struck it and why it left are not examined. Source: committed batch summaries (observed).

## Cherbourg: what took the port a week early (26 November 2026)

Traced on seed 101 with `F44_FORM` and `F44_ZONE=212,28,262,72` (map coordinates).

| Finding or change | Basis |
| --- | --- |
| Finding: British divisions took Cherbourg. On 16 June at 1900 the 50th Division went 64 km by truck to Sainte-Mère-Église and marched on Beaumont, on Cap de la Hague. The 11th Armoured, 49th and 51st followed. They cut off the garrison on the evening of 17 June and destroyed it by 1522 on 18 June. | Observed, seed 101, `F44_FORM="50th,9.5,12.5"` and the zone trace. |
| Cause 1: the closed ground of the northern Cotentin stopped at map x 228. Beaumont stands at x 222, so it was open before 19 June. | `PHASES` third entry; objective list printed with map coordinates. |
| Cause 2: the staff AI sends a free division to any open objective within 150 km (`aiRng`), four divisions to an objective. Until 3 July every objective south of the lodgment is closed, so the idle British divisions had Cap de la Hague and, from 19 June, Cherbourg. | `sim.js` operational AI; `aiRng: 150`, `aiPerVP: 4` in the scenario. |
| Change: the closed ground runs to the west coast. | `PHASES`, northern Cotentin line. |
| Change: a boundary between First US Army and Second British Army until 1 August: Port-en-Bessin, west of Bayeux, east of Caumont, then south. British formations are closed west of it and US formations east of it. This reverses the earlier row "Left alone: British divisions in the Cotentin". `F44_OFF=bound` removes it. | Engine: `S.phaseBlock` takes `nat`, `west`, `east`. The June course is general history; the course south of Caumont and the end date are game settings (inference). To verify against Ellis, Victory in the West I, and Harrison. |
| Finding: with the British gone, the US 79th Division walked round the 16 km land front and held Cherbourg on 19 June. | Observed, seed 101, second trace. |
| Change: the land front is an arc from coast to coast in three faces: 243rd and 91st west, 77th south, 709th east. | `QL`, `Q`, `QB`, `GFALL`. Course by inference from Harrison's "depth of about five miles"; which division holds which face is a game setting (inference). |
| Finding: the garrison fell back three kilometres under pressure, out of the port, and the port counted as lost. | Report at 0602 on 18 June, seed 101. |
| Change: a fortress flag. A fortress garrison does not take the three-kilometre fall-back and its stand has no end date or strength floor. Set for the Cherbourg garrison only; Brest is left for the pursuit work. | `sim.js` `F.fortress`; scenario flag on `ge-festung-cherbourg`. Von Schlieben holding to 26 June is general history. |
| Finding and change: 6th Airborne Division carried US nationality from its template. It drew US replacements, and it stood in Cherbourg on 21 June. Now British. | `tools/scenario-overlord.js` Allied builder; OOB `nat: UK`. |
| On trial: a seventh German supply source, "Cherbourg fortress stocks". Every German unit in the north reports "cut off" from 19 June without it. `F44_OFF=chsrc` removes it. One traced game with it ran very differently (Carentan 7 June, Saint-Lô 14 June); adding a source shifts the random draws at setup, so one game cannot separate the source's effect from a new roll of the dice. Two batches decide. | Observed, seed 101; `sim.js` setup draws a random number per source. Fortress stocks are general history; their size is a game setting (inference). |
| Result, one game, all changes except the stocks: Cherbourg held from 21 June (history 26 June; 18 June before). The land front broke on 20 June under the 79th and 9th Divisions and the garrison's battalions were driven from the port on 21 June. | Observed, seed 101, third trace. |
| Still open: the garrison is two battalions against Harrison's 21,000 men in the fortress; six US divisions crowd the peninsula where three fought; Saint-Lô fell on 21 June in the same game. | Observed; Harrison figure as cited in the OOB note, to verify. |
| Tests: regression baselines unchanged for every other scenario; command tests pass. | `tools/regress.js`, `tools/test-command.js`. |

## Batches 33 and 34: the Cherbourg fixes (27 November 2026)

Runs holding the objective at the end, and the median date held from. 20 games each.

| Objective | Historical | 32 before | 33 Cherbourg fixes | 34 and fortress stocks |
| --- | --- | --- | --- | --- |
| Cherbourg | 06-26 | 20, 06-19 | 19, 06-20 | 20, 06-20 |
| Caen | 07-09 | 17, 07-11 | 19, 07-08 | 20, 07-08 |
| Saint-Lô | 07-18 | 19, 07-03 | 20, 07-03 | 19, 07-03 |
| Avranches | 07-30 | 18, 07-27 | 19, 07-27 | 19, 07-27 |
| Rennes | 08-04 | 19, 08-04 | 20, 08-04 | 20, 08-03 |
| Le Mans | 08-08 | 20, 08-13 | 20, 08-12 | 20, 08-11 |
| Nantes | 08-12 | 19, 08-11 | 20, 08-11 | 20, 08-10 |
| Orléans | 08-16 | 20, 08-11 | 20, 08-11 | 20, 08-11 |
| Falaise | 08-17 | 18, 08-09 | 17, 08-10 | 19, 08-05 |
| Chartres | 08-18 | 19, 08-10 | 19, 08-08 | 20, 08-08 |
| Paris | 08-25 | 12, 08-25 | 8, 08-23 | 5, 08-27 |
| Rouen | 08-30 | 4, 08-24 | 2, 08-22 | 3, 08-26 |
| Brest | 09-19 | 8, 08-28 | 11, 08-27 | 7, 08-26 |
| Median losses, Allied / German | | 162 / 355 | 167 / 369 | 169 / 352 |

| Reading | Basis |
| --- | --- |
| The fixes moved the median Cherbourg date one day, from 19 to 20 June. The port still falls six days early. | Batch summaries in `docs/tests`. |
| The fortress stocks made no difference to Cherbourg. They are now off; `F44_ON=chsrc` restores them. | Batches 33 and 34. |
| Paris fell from 12 runs to 8 and 5. Twenty games cannot say whether the boundary did that or chance did (inference). | Batches 32 to 34. |
| What is left at Cherbourg is the weight of the assault against the size of the defence: the land front breaks in a day. | One traced game, seed 101 (inference for the batch as a whole). |

## Cherbourg: a stronger defence (27 November 2026)

Tov's decision after batches 33 and 34: strengthen the defence; leave the number of attackers alone.

| Change or finding | Basis |
| --- | --- |
| Change: the garrison is a full infantry division's worth, nine battalions with artillery, at experience 0.7. | `GFULL`, `xpOf`. About 21,000 men in the fortress is the figure in the order-of-battle note, citing Harrison, to verify. Nine battalions and 0.7 are game settings (inference). |
| Change: prepared works. A scenario lists forts (side, centre, radius, strength, objective). A unit of that side standing inside them, while the objective is held, is dug in to the fort's strength within the hour. Cherbourg: 13 km round the port at 1.4, against 1.0 for field digging. | `sim.js` `S.fortz` and the dig-in rule; `forts` in the scenario. The works are general history (Harrison); 1.4 and 13 km are game settings (inference). |
| Finding: with the bigger garrison alone, the garrison left the port again. Shaken units retreat away from the nearest enemy, and the garrison's centre drifted 11 km south while five US divisions sat in Cherbourg. | Observed, seed 101, fourth trace. |
| Change: a shaken unit of a fortress garrison goes back to the middle of the fortress, and one already there stands. | `sim.js` `startRetreat`. |
| Result, one game: the garrison holds the port from 19 June and is destroyed there on the morning of 24 June (history: surrender 26 June). | Observed, seed 101, `F44_FORM="Cherbourg fortress,13,20"`. |
| Tests: regression baselines unchanged for every other scenario; command tests pass. | `tools/regress.js`, `tools/test-command.js`. |
| Port to Sarn Corridor: `F.fortress`, `S.fortz`, the army boundary in `S.phaseBlock`. All three do nothing unless a scenario asks for them. | Engine change list. |

## Batch 35: the stronger Cherbourg defence (27 November 2026)

| Reading | Basis |
| --- | --- |
| Cherbourg: held at the end in 20 of 20 games, median date 25 June, range 21 to 27 June. History 26 June. Batch 33 gave 20 June. | `docs/tests/batch-20261127-0415-35-cherbourg-fortress.md`. |
| The other objectives moved a day or less from batch 33. Median losses 158 Allied, 355 German. | Same file; batch 33 summary. |
| Paris held at the end: 12 games in batch 32, then 8, 5 and 4. The fall began with the army boundary in batch 33. Cause not yet traced (inference that the boundary is involved). | Batches 32 to 35. |

## Paris: why the Allies stopped taking it (27 November 2026)

Two full games on seed 101 with `F44_TRACE2=66` and a zone trace round Paris and Chartres: one with the army boundary, one with `F44_OFF=bound`.

| Finding or change | Basis |
| --- | --- |
| Finding: neither game took Paris, with or without the boundary. No Allied formation stood within the Paris and Chartres zone from 20 August in the boundary game. | Observed, seed 101, both traces. |
| Finding: Third Army's corps went south of the Loire (Romorantin, Valençay, Graçay, Loches) and west to the Loire mouth (Pornic, Guérande, Bourgneuf-en-Retz) in mid-August. | Observed, corps trace, 12 to 22 August. |
| Finding: a corps whose objective was already taken kept its old order for days: XII Corps on Saumur for 249 hours, VIII Corps on Sarzeau for 355 hours, XX Corps on Montreuil-Bellay from 121 km away. Supply was above the army's floor. The army AI looks only 90 km for a new objective; reading the code, a corps with nothing left in reach gets no order (inference: the trace does not print the search itself). | Observed, seed 101 without the boundary, 24 to 31 August; `command.js` `armyTick`. |
| Change: the ground south of the Loire is closed to the Allied AI for the whole scenario. `F44_OFF=loire` reopens it. | `PHASES`. Third Army's flank on the Loire is general history; the line's course five kilometres south of the river towns is a game setting (inference). |
| Change: a corps that finds no objective within reach looks as far as it must. `F44_OFF=far` restores the old rule. | `command.js` `armyTick`, `cfg.far`. |
| Open: whether the army boundary cost anything. Batch 36 runs without it. | Queued. |
| Tests: regression baselines unchanged for every other scenario; command tests pass. | `tools/regress.js`, `tools/test-command.js`. |

## Batches 36 to 38: Paris (27 November 2026)

Games holding the objective at the end, out of 20, and the median date held from.

| Objective | Historical | 35 before | 36 no boundary | 37 Loire closed | 38 Loire and longer reach |
| --- | --- | --- | --- | --- | --- |
| Cherbourg | 06-26 | 20, 06-25 | 20, 06-26 | 20, 06-25 | 20, 06-25 |
| Chartres | 08-18 | 20, 08-08 | 19, 08-09 | 20, 08-09 | 20, 08-08 |
| Paris | 08-25 | 4, 08-26 | 7, 08-26 | 13, 08-25 | 20, 08-24 |
| Rouen | 08-30 | n/a | 5, 08-27 | 6, 08-25 | 12, 08-25 |
| Brest | 09-18 | 6, 08-27 | 9, 08-27 | 11, 08-27 | 7, 08-27 |
| Median losses, Allied / German | | 158 / 355 | 163 / 350 | 170 / 363 | 189 / 371 |

| Reading | Basis |
| --- | --- |
| Paris: 20 of 20 with both fixes, median 24 August, range 22 to 30 August. | `docs/tests/batch-20261127-0838-38-loire-far.md`. |
| Each fix carries part of it: the Loire closure alone gives 13, the longer reach brings it to 20. | Batches 37 and 38. |
| The army boundary cost little or nothing: 7 without it against 4 with it, inside the spread of 20 games (inference). It stays. | Batches 35 and 36. |
| Rouen doubled to 12 of 20. Allied losses rose from 158 to 189. | Batch 38. |
| Still early: Saint-Lô 3 July (history 18 July), Falaise 7 August (17), Chartres 8 August (18), Orléans 11 August (16), Brest 27 August (18 September). | Batch 38. |

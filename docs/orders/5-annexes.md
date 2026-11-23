---
title: "Annexes A to G to the Operations Orders, 6 June to 1 September 1944"
author: "Tov Binyamin Brog"
---

These annexes serve all four roles. The game reads its forces, dates and places from the data files named below, so a corrected data file changes the game and these annexes together.

## Annex A: Task organization

**Allied divisions and their arrival.** 39 divisions land between 6 June and 1 September 1944, each on its historical arrival date from `data/oob/allied-1944.json`.

| Date | Divisions landing |
| --- | --- |
| 6 June, by air in the night | 82nd and 101st Airborne (US); 6th Airborne (British) |
| 6 June, by sea | 1st, 4th, 29th Infantry (US); 3rd and 50th (British); 3rd Canadian |
| 7 to 30 June | 16 more, among them the 2nd and 3rd Armored, 9th, 30th, 79th and 90th Infantry (US), and the Guards, 7th and 11th Armoured and the 51st Highland (British) |
| July | 11 more, among them the 4th, 5th and 6th Armored (US), the 2nd Canadian, the 4th Canadian Armoured and the 1st Polish Armoured |
| 1 to 10 August | 2e Division Blindée (French), the 7th Armored and 80th Infantry (US) |

The corps each division joined, and when, come from `data/oob/attachments-1944.json`: 113 of 126 rows rest on the US Theater Historian's assignment tables and Ellis's narrative.

**German divisions.** 44 divisions take part. 22 stand in their positions on 6 June; the other 22 enter from the map edges on the dates in `data/oob/german-1944.json`. Divisions sent to the Normandy front hold their sectors until 16 August 1944.

## Annex B: Intelligence estimate

1. *Coast.* Static divisions hold the beaches in strongpoints with little transport. They fight where they stand.
2. *Reserves.* Panzer divisions move by night when Allied fighter-bombers are about, and halt under cover by day. Expect them at the front a night or two after they are released.
3. *Brittany.* Infantry and parachute divisions march on foot, which takes them four to six days to reach Normandy.
4. *Air.* About 319 German aircraft can operate on D-Day, rising to about 1,000 a week later as reinforcements arrive.

## Annex C: Operations overlay and objectives

The largest objectives are Paris (40 points), Cherbourg and Caen (30), and Brest (25). Nantes, Le Havre, Amiens, Tours, Angers, Versailles, Orléans, Lorient and St-Lô count 20 each. Every other town of 10,000 people counts 10, and smaller road towns 3. A town changes hands after one side alone has held it for half an hour with troops in fighting order.

The game compares your pace with these historical capture dates:

| Objective | Historical | Objective | Historical |
| --- | --- | --- | --- |
| Carentan | 12 June | Le Mans | 8 August |
| Cherbourg | 26 June | Nantes | 12 August |
| Caen | 9 July | Orléans | 16 August |
| St-Lô | 18 July | Falaise | 17 August |
| Coutances | 28 July | Chartres | 18 August |
| Avranches | 30 July | Paris | 25 August |
| Rennes | 4 August | Rouen | 30 August |

## Annex D: Air plan

1. *Allied fields.* Groups fly from southern England at first. In this build the fields are those open on 6 June; the advanced landing grounds that opened later (dates in `data/air/airfields-1944.json`) join the game in a later build. Captured German fields need repair before use.
2. *Roles.* Each squadron flies one role: close support, air cover, interdiction or bombing. Close support answers the division commanders' calls. Interdiction attacks traffic in the zones you mark.
3. *Troop carriers.* One fleet of 1,360 aircraft serves airborne lifts and supply drops, one lift per aircraft per day.
4. *Weather.* Rain, fog and low cloud ground aircraft. The storm of 19 to 22 June grounds most of them.

## Annex E: Fire support

Naval gunfire supports the assault from offshore: battleships with a range of about 30 km and cruisers with about 23 km. Corps artillery, tank and tank destroyer battalions wait in the Support tab until you attach them to a division.

## Annex F: Supply and replacements

1. *Sources.* Five beach dumps open between H+8 and H+9 on 6 June. Mulberry B at Arromanches opens on 16 June. Cherbourg port opens about 19 days after it is taken and held.
2. *Delivery.* Truck columns carry supply from the nearest open source to each division by road. Enemy troops on the road stop the columns.
3. *Cut off.* A division with no open road to a source loses about 1 percent of its strength a day while its stock lasts, and 4 percent once it runs out.
4. *Replacements.* In this build divisions receive no replacements. The replacement pool comes in a later build.
5. *Standing.* Eisenhower's standing is reviewed on 25 July and 22 August. A composite under 40, or any capital under 20, brings a warning; a second failure, or a composite under 25 at any time, brings relief.

## Annex G: Signal and controls

1. *Map.* Drag to move, wheel to zoom, right-drag to rotate and tilt. The **Map** button frames the whole theater.
2. *Orders.* Select a division, press **Draw line of advance**, drag the route, draw the objective line, and press **Issue order**. **Hand to staff** lets the AI run a division.
3. *Corps orders.* The Forces list groups divisions by corps. Press **Order the whole corps** on a division's card, then draw: the corps commander takes about an hour to plan, splits the objective line among his divisions, keeps a reserve if he is cautious, and commits it where a division stalls.
4. *Clock.* Space pauses. The speed buttons run 1x, 4x, 12x and 40x. The clock stops when a report needs a decision.
5. *Reports.* Click a report to jump to the place. Bold reports need your attention.

---

**Source trace**

| Passage | Source | Status |
| --- | --- | --- |
| Allied divisions and arrival dates | `data/oob/allied-1944.json`: Order of Battle of the US Army, ETO (1945); Ellis I | US sourced; British and Canadian dates verify |
| Corps attachments | `data/oob/attachments-1944.json`: Theater Historian assignment tables; Ellis I | 113 of 126 rows sourced |
| German divisions, positions and arrivals | `data/oob/german-1944.json`: Ellis I, Harrison, Blumenson | 33 arrival dates sourced, 5 inference, 13 verify |
| Hold until 16 August | General history (Hitler's withdrawal order) | Verify against Blumenson |
| German moves by night; march times | The game's transport model (`engine/src/transport.js`) | Game design |
| 319 aircraft on D-Day; about 1,000 a week later | Ellis I p. 566 | Sourced |
| 1,360 troop carrier aircraft | Ellis I pp. 72-73 | Sourced |
| Historical capture dates | General history | Verify against Blumenson and Ellis |
| Mulberry B on 16 June; storm of 19 to 22 June | Ruppenthal I p. 406 | Sourced |
| Cherbourg clearing time | General history | Verify against Ruppenthal ch. XI |
| Corps membership by date | `data/oob/attachments-1944.json` | US sourced; British snapshots per row |
| Naval gun ranges; supply and cut-off rules | The game (`engine/src/data.js`, `engine/src/sim.js`) | Game design |
| Airfield opening dates | `data/air/airfields-1944.json`: Johnson (1988) for US fields | US sourced; RAF inference |

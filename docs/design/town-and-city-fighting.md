# Town and City Fighting: Design Note

Tov Binyamin Brog · 24 November 2026

## Decisions

Tov set three rules on 24 November 2026:

1. **Taking a town means a unit in the town.**
2. **Cities have districts.**
3. **A city fight favors an infantry assault, with armor in support.**

He then asked for two corps-level rules to be added and the whole note implemented:

4. **The corps commander gives the town to infantry.** He takes account of each division's type when he divides an objective.
5. **The corps commander holds the armor back** when the objective takes in a town.

## What the game does

### 1. Troops in the town

Each objective with a built-up area on the map (four or more town or city cells of 1 km) owns those cells. The town changes hands when one side's formed troops stand in its built-up cells, or within 0.7 km of its centre, and none of the other side's do, for three checks in a row. Headquarters still block a capture and cannot make one.

Villages too small to show a built-up area keep the engine's rule: troops within 1.2 km of the point.

In Overlord 58 of 383 objectives have a built-up area. Caen has nine cells, Cherbourg nine, Brest thirteen, Rennes eight, Saint-Lô four.

### 2. Districts

A city named in the scenario's `districts` list is several objectives. The built-up cells are shared out by flooding from each district's point through built-up ground, so a river forms a boundary. Where two floods meet, the nearer point takes the cell.

| City | District | Points | Historical date |
| --- | --- | --- | --- |
| Caen | Caen (north bank of the Orne) | 18 | 9 July |
| Caen | Vaucelles (south bank) | 12 | 19 July |
| Cherbourg | Cherbourg (the city) | 20 | 26 June |
| Cherbourg | Arsenal de Cherbourg (arsenal and harbour forts) | 10 | 27 June |

The Cherbourg port opens 456 hours after the arsenal district falls.

Brest and Paris stay single objectives for now. Brest lies beyond the Allied reach in this slice, and the map's built-up area for Paris is broken into patches that need repair first.

### 3. Infantry assault, armor in support

The engine already gave town and city ground strong cover and denied tanks their close-range bonus there. The module adds:

| Situation | Effect | Setting |
| --- | --- | --- |
| Tanks fire into a town with no friendly infantry within 0.8 km | Their fire on soft targets is multiplied by 0.6 | `armSoft` |
| Infantry attack a town with friendly tanks within 0.8 km | Their fire is multiplied by 1.25 | `combined` |
| Infantry within 0.5 km of a tank, when either stands in a town | Their anti-tank fire is multiplied by 2.5 | `faust` |
| The same, when the tank has friendly infantry within 0.8 km | Multiplied by 1.4 | `faustGuarded` |

"Infantry" here means rifle, armored infantry, engineer and commando battalions.

The general of an armored division or brigade (a third or more of its leading battalions are tanks) ordered into an enemy-held town reports: "My tanks will be exposed in the streets of Caen. I recommend infantry lead the assault, with armor in support." He still obeys.

### 4 and 5. The corps commander

When a corps objective line crosses the built-up area of an enemy-held town:

- With three or more divisions, at least two of them infantry, he holds his armored division in reserve, wherever it stands in the line. He reports: "7th Armoured Division is held in reserve: Caen is infantry work."
- With an armored division forward beside an infantry division, he moves the boundary between them so the town lies in the infantry division's sector. He reports who takes the town.
- An objective with no town on it is divided as before, by the divisions' weight.

An order with `reserve: false` overrides the first rule.

## Orders

Districts are ordinary objectives, so the existing orders reach them:

- **Order the city.** Draw the objective line across the whole city. The division or corps works through the districts its line of advance meets, and each district's fall is reported.
- **Order one district.** Draw the objective line across that district alone.
- **Order a corps at the city.** The corps commander applies rules 4 and 5.

## Left out of this version

| Item | Why |
| --- | --- |
| Rubble from heavy bombing | Tov has not decided. It ties to the air plan |
| Armor slowed by streets | Roads run through every town; slowing them would slow all road marches. Needs a rule that applies only to a contested town |
| The objective line snapping to a district's edge | Interface work, after the rules are tested |
| A division that may not leave a half-taken district until relieved | Tov has not decided |
| Brest and Paris districts; fortress garrisons | Next step, with the German commander |

## Testing

- The earlier scenarios do not load the module and match their baselines.
- Batch 14 measures the interim 2.5 km rule. A new batch must measure this module against it.

## Source trace

| Passage | Source | Status |
| --- | --- | --- |
| Rules 1 to 5 | Tov, in conversation on 24 November 2026 | Sourced (owner decisions) |
| Caen north bank 9 July | Ellis, Victory in the West, vol. I, map "British attack 8th and 9th July" | Sourced |
| Vaucelles 19 July; Cherbourg arsenal 27 June | General history | Verify against Ellis vol. I and Harrison |
| Cherbourg 26 June; port opening three weeks after capture | Blumenson p. 37; Ruppenthal vol. I p. 464 | Sourced |
| Existing cover and close-range rules | `engine/src/map.js` (COVER), `engine/src/sim.js` (fireAt) | Sourced (code) |
| All multipliers, distances and the four-cell threshold | Claude's settings in `engine/src/urban.js` | Inference (game settings) |
| District points on the map and the split of points | Claude's placement in `tools/scenario-overlord.js` | Inference |
| Infantry-led town fighting and the danger of hand-held anti-tank weapons to unsupported tanks | General history of 1944 | Verify against FM 31-50 (Attack on a Fortified Position and Combat in Towns, 1944) |
